import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, PermissionsAndroid, ActivityIndicator, Alert } from 'react-native';
import OpenAI from 'openai';
import { WebView } from 'react-native-webview';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';

const ForceDirectedGraph = ({ transcription, uid, audioid, xmlData }) => {
  const [graphData, setGraphData] = useState(null);
  const viewShotRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [tempWebView, setTempWebView] = useState(null);
  const webViewRef = useRef(null);
  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-fed0eb08e6ad4f1aabe2b0c27c643816',
  });

  const parseXMLData = (xmlString) => {
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: true });
    try {
      const jsonData = parser.parse(xmlString);
      const formattedData = formatGraphData(jsonData);
      if (formattedData) setGraphData(formattedData);
    } catch (err) {
      console.error('Error parsing XML:', err);
    }
  };

  const formatGraphData = (root) => {
    const formatNode = (node, name = 'Root') => {
      const formattedNode = { name, children: [] };

      if (node['#text'] || node['?xml']) return null;

      if (node.meeting && node.meeting.topic) {
        const topics = Array.isArray(node.meeting.topic) ? node.meeting.topic : [node.meeting.topic];
        topics.forEach((topic, index) => {
          const topicNode = { name: topic['@_name'] || `Topic ${index + 1}`, children: [] };
          if (topic.description) topicNode.children.push({ name: topic.description });
          if (topic.subtopic) {
            const subtopics = Array.isArray(topic.subtopic) ? topic.subtopic : [topic.subtopic];
            subtopics.forEach((subtopic) => {
              const subtopicNode = { name: subtopic['@_name'], children: [] };
              if (subtopic.description) subtopicNode.children.push({ name: subtopic.description });
              if (subtopic.action_items?.item) {
                const items = Array.isArray(subtopic.action_items.item) ? subtopic.action_items.item : [subtopic.action_items.item];
                items.forEach((item) => subtopicNode.children.push({ name: item }));
              }
              topicNode.children.push(subtopicNode);
            });
          }
          formattedNode.children.push(topicNode);
        });
        return formattedNode;
      }

      Object.entries(node).forEach(([key, value]) => {
        if (typeof value === 'object') {
          const child = formatNode(value, key);
          if (child) formattedNode.children.push(child);
        } else {
          formattedNode.children.push({ name: key, children: [{ name: String(value) }] });
        }
      });
      return formattedNode;
    };

    return root ? [formatNode(root)] : null;
  };

  const fetchGraphData = async (transcription) => {
    try {
      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: `Generate a hierarchical XML structure from this meeting transcript: "${transcription}".
            Create a tree structure with main topics and subtopics.
            Use this format:
            <meeting>
              <topic name="Main Topic 1">
                <subtopic name="Subtopic 1">
                  <description>Detailed description of subtopic</description>
                  <action_items>
                    <item>Action item 1</item>
                    <item>Action item 2</item>
                  </action_items>
                </subtopic>
                <subtopic name="Subtopic 2">
                  <description>Detailed description of subtopic</description>
                </subtopic>
              </topic>
              <topic name="Main Topic 2">
                <description>Overall description of topic</description>
              </topic>
            </meeting>`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        console.log('XML Response from API:', content);
        sendXmlGraphData(content);
        parseXMLData(content);
      } else {
        console.error('No valid response from API');
      }
    } catch (error) {
      console.error('Error fetching graph data:', error.response?.data || error.message);
    }
  };

  // Send XML graph data to the API
  const sendXmlGraphData = async (xmlData) => {
    if (!xmlData) {
      console.error('No XML data available to send.');
      return;
    }

    try {
      const response = await axios.post('https://matrix-server.vercel.app/sendXmlGraph', {
        uid,
        audioid,
        xmlData,
      });
      console.log('XML Graph Data Sent:', response.data);
      console.log('Sending XML to Database:', xmlData);

    } catch (error) {
      console.error('Error sending XML Graph Data:', error.message);
    }
  };

  useEffect(() => {
    console.log('ViewShot Ref:', viewShotRef.current); // Should not be null
  }, []);
  

  useEffect(() => {
    if (xmlData) parseXMLData(xmlData);
    else if (transcription) fetchGraphData(transcription);
  }, [transcription, xmlData]);

  if (!graphData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading graph...</Text>
      </View>
    );
  }

  
  const chartHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  </head>
  <body>
    <div id="chart" style="width: 100%; height: 1200%;"></div>
    <script>
      const chartDom = document.getElementById('chart');
      const myChart = echarts.init(chartDom);
      const colors = ['#5470C6', '#91CC75', '#EE6666', '#FAC858', '#73C0DE', '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC'];

      function assignColors(node, index = 0) {
        node.lineStyle = { color: colors[index % colors.length] };
        if (node.children) {
          node.children.forEach((child, idx) => assignColors(child, idx));
        }
        return node;
      }

      const coloredGraphData = ${JSON.stringify(graphData)}.map((node, idx) => assignColors(node, idx));

      // Function to wrap text into multiple lines with dynamic max length
      function wrapText(text, nodeType) {
        let maxLineLength = 20; // Default for topic and subtopic nodes
        if (nodeType === 'description') {
          maxLineLength = 90; // For description nodes
        }

        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
          if ((currentLine + word).length > maxLineLength) {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });

        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        return lines.join('\\n'); // Join lines with newline character
      }

      // Function to calculate label height based on number of lines
      function calculateLabelHeight(text, fontSize = 18, lineHeight = 1.5) {
        const lines = text.split('\\n').length;
        return lines * fontSize * lineHeight;
      }

      // Function to calculate dynamic spacing for nodes
      function calculateDynamicSpacing(data) {
        const maxLabelHeight = Math.max(
          ...data.map(node => calculateLabelHeight(node.name))
        );
        return {
          layerSpacing: maxLabelHeight * 3, // Triple the max label height for vertical spacing
          nodeSpacing: maxLabelHeight * 2, // Double the max label height for horizontal spacing
        };
      }

      const { layerSpacing, nodeSpacing } = calculateDynamicSpacing(coloredGraphData);

      // Custom layout algorithm to adjust node positions
      function adjustNodePositions(data) {
        const layers = {};
        data.forEach(node => {
          if (!layers[node.depth]) {
            layers[node.depth] = [];
          }
          layers[node.depth].push(node);
        });

        Object.values(layers).forEach(layer => {
          let yOffset = 0;
          layer.forEach(node => {
            const labelHeight = calculateLabelHeight(node.name);
            node.y = yOffset + labelHeight / 2; // Center the node vertically
            yOffset += labelHeight + nodeSpacing; // Add spacing between nodes
          });
        });

        return data;
      }

      const adjustedGraphData = adjustNodePositions(coloredGraphData);

      const option = {
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: [{
          type: 'tree',
          data: adjustedGraphData,
          top: '5%',
          left: '20%',
          bottom: '5%',
          right: '20%',
          roam: true,
          symbolSize: 8,
          label: {
            position: 'left',
            verticalAlign: 'middle',
            align: 'right',
            fontSize: 18,
            formatter: (params) => {
              // Wrap text into multiple lines based on node type
              const nodeType = params.data.nodeType || 'topic'; // Default to 'topic'
              return wrapText(params.name, nodeType);
            },
            rich: {
              a: {
                lineHeight: 24, // Adjust line height to match font size
              }
            }
          },
          leaves: {
            label: {
              position: 'right',
              verticalAlign: 'middle',
              align: 'left',
              formatter: (params) => {
                // Wrap text into multiple lines based on node type
                const nodeType = params.data.nodeType || 'description'; // Default to 'description'
                return wrapText(params.name, nodeType);
              },
              rich: {
                a: {
                  lineHeight: 24, // Adjust line height to match font size
                }
              }
            },
          },
          emphasis: { focus: 'descendant' },
          expandAndCollapse: true,
          initialTreeDepth: 3,
          force: {
            repulsion: 1000, // Significantly increase repulsion to push nodes further apart
            gravity: 0.1,   // Adjust gravity to control how tightly nodes are pulled together
            edgeLength: 300, // Increase edge length to control the distance between connected nodes
            layoutAnimation: true, // Enable layout animation for smoother transitions
          },
          // Add dynamic vertical spacing between layers
          layerSpacing: layerSpacing, // Dynamic vertical spacing
          // Add dynamic horizontal spacing between nodes
          nodeSpacing: nodeSpacing,  // Dynamic horizontal spacing
        }],
      };
      myChart.setOption(option);
    </script>
  </body>
  </html>
`;

const downloadPDF = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Storage permission denied');
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              background: white;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            #chart { 
              width: 1500px; 
              height: 600px;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div id="chart"></div>
          <script>
            const chartDom = document.getElementById('chart');
            const myChart = echarts.init(chartDom, null, {
              renderer: 'svg',
              width: 1000,
              height: 600
            });
            
            function wrapText(text, nodeType) {
              let maxLineLength = 20;
              if (nodeType === 'description') {
                maxLineLength = 90;
              }

              const words = text.split(' ');
              const lines = [];
              let currentLine = '';

              words.forEach(word => {
                if ((currentLine + word).length > maxLineLength) {
                  lines.push(currentLine.trim());
                  currentLine = word + ' ';
                } else {
                  currentLine += word + ' ';
                }
              });

              if (currentLine.trim()) {
                lines.push(currentLine.trim());
              }

              return lines.join('\\n');
            }

            const graphData = ${JSON.stringify(graphData)};
            
            const option = {
              backgroundColor: '#ffffff',
              tooltip: { 
                trigger: 'item', 
                triggerOn: 'mousemove' 
              },
              series: [{
                type: 'tree',
                data: graphData,
                top: '5%',
                left: '2%',
                bottom: '5%',
                right: '15%',
                symbolSize: 8,
                initialTreeDepth: -1,
                orient: 'LR',
                label: {
                  position: 'left',
                  verticalAlign: 'middle',
                  align: 'right',
                  fontSize: 18,
                  distance: 5,
                  formatter: (params) => {
                    const nodeType = params.data.nodeType || 'topic';
                    return wrapText(params.name, nodeType);
                  },
                  rich: {
                    a: {
                      lineHeight: 24,
                    }
                  }
                },
                leaves: {
                  label: {
                    position: 'right',
                    verticalAlign: 'middle',
                    align: 'left',
                    formatter: (params) => {
                      const nodeType = params.data.nodeType || 'description';
                      return wrapText(params.name, nodeType);
                    }
                  }
                },
                expandAndCollapse: false,
                animationDuration: 0,
                force: {
                  repulsion: 1200,
                  gravity: 0.1,
                  edgeLength: 300,
                  layoutAnimation: false
                },
                nodeSpacing: 60,
                layerSpacing: 200,
                roam: false,
                lineStyle: {
                  width: 2,
                  curveness: 0.5
                }
              }]
            };
            
            myChart.setOption(option);
            
            // Wait for chart to render then capture
            setTimeout(() => {
              const base64 = myChart.getDataURL({ 
                type: 'png', 
                pixelRatio: 2,
                backgroundColor: '#fff',
                excludeComponents: ['toolbox']
              });
              window.ReactNativeWebView.postMessage(base64);
            }, 2000);
          </script>
        </body>
      </html>
    `;

    return new Promise((resolve, reject) => {
      let hasProcessedImage = false;

      const processBase64Image = async (base64Image) => {
        if (hasProcessedImage) return;
        hasProcessedImage = true;

        try {
          const pdfOptions = {
            html: `
              <html>
                <body style="margin: 0; padding: 0;">
                  <img src="${base64Image}" style="width: 100%; height: auto; display: block;" />
                </body>
              </html>
            `,
            fileName: `mindmap_${Date.now()}`,
            directory: 'Documents',
            width: 1684,  // A3 width (landscape)
            height: 1190, // A3 height (landscape)
            backgroundColor: '#ffffff',
            padding: 0,
            options: {
              landscape: true,
              printBackground: true,
              preferCSSPageSize: true,
              margin: {
                top: '5mm',
                right: '5mm',
                bottom: '5mm',
                left: '5mm'
              },
              pageSize: 'A3'
            }
          };

          const file = await RNHTMLtoPDF.convert(pdfOptions);
          
          if (file.filePath) {
            if (Platform.OS === 'android') {
              const downloadPath = `${RNFS.DownloadDirectoryPath}/mindmap_${Date.now()}.pdf`;
              await RNFS.moveFile(file.filePath, downloadPath);
              resolve(downloadPath);
            } else {
              resolve(file.filePath);
            }
          } else {
            reject(new Error('PDF generation failed'));
          }
        } catch (error) {
          reject(error);
        }
      };

      const TempWebView = (
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          javaScriptEnabled={true}
          onMessage={(event) => {
            processBase64Image(event.nativeEvent.data);
          }}
          style={{ width: 1, height: 1, opacity: 0 }}
        />
      );

      setTempWebView(TempWebView);

      setTimeout(() => {
        setTempWebView(null);
        if (!hasProcessedImage) {
          reject(new Error('Timeout generating PDF'));
        }
      }, 5000);
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

const handleDownload = async () => {
  try {
    setLoading(true);
    if (!graphData) {
      Alert.alert('No Data', 'Please wait for the mind map to load completely.');
      return;
    }

    const filePath = await downloadPDF();
    
    // Share the PDF
    await Share.open({
      url: `file://${filePath}`,
      type: 'application/pdf',
      title: 'Mind Map PDF'
    });

    Alert.alert('Success', 'PDF has been downloaded successfully!');
  } catch (error) {
    console.error('Failed to download PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <ViewShot 
        ref={viewShotRef} 
        options={{ format: 'png', quality: 1.0 }}
        style={{ flex: 1 }}
      >
        <WebView
          originWhitelist={['*']}
          source={{ html: chartHtml }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          style={{ height: 600, width: '100%' }}
          onLoadEnd={() => {
            // Wait for the chart to be fully rendered
            setTimeout(() => {
              console.log('Chart rendered and ready for capture');
            }, 1000);
          }}
        />
      </ViewShot>

      {tempWebView}  {/* Render temporary WebView when needed */}

      <TouchableOpacity 
        style={[
          styles.downloadButton,
          loading && styles.downloadButtonDisabled
        ]} 
        onPress={handleDownload}
        disabled={loading}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <>
              <ActivityIndicator color="#fff" style={styles.loader} />
              <Text style={styles.buttonText}>Downloading...</Text>
            </>
          ) : (
            <>
              <Text style={styles.buttonText}>Download PDF</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  downloadButton: {
    backgroundColor: '#007bff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3, // Add shadow for Android
    shadowColor: '#000', // Add shadow for iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  downloadButtonDisabled: {
    backgroundColor: '#cccccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loader: {
    marginRight: 8,
  },
});

export const getSvgData = () => {
  return new Promise((resolve) => {
    const script = `
      (function() {
        const chart = echarts.getInstanceByDom(document.getElementById('chart'));
        if (!chart) return '';
        const svg = chart.renderToSVGString();
        return svg;
      })();
    `;
    
    // Execute script in WebView context
    const webViewRef = document.getElementsByTagName('webview')[0];
    if (webViewRef) {
      webViewRef.executeJavaScript(script, true)
        .then(svg => resolve(svg))
        .catch(() => resolve(''));
    } else {
      resolve('');
    }
  });
};

export default ForceDirectedGraph;
