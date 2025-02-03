import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OpenAI from 'openai';
import { WebView } from 'react-native-webview'; // WebView for rendering ECharts
import axios from 'axios'; // For API calls
import { XMLParser } from 'fast-xml-parser';

const ForceDirectedGraph = ({ transcription, uid, audioid, xmlData }) => {
  const [graphData, setGraphData] = useState(null);
  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-fed0eb08e6ad4f1aabe2b0c27c643816',
  });
console.log(xmlData);

  const parseXMLData = (xmlString) => {
    // Extract just the XML portion from the response
    const xmlMatch = xmlString.match(/<[^>]+>.*<\/[^>]+>/s);
    if (!xmlMatch) {
      console.error('No valid XML found in response');
      return;
    }
  
    const cleanedXMLString = xmlMatch[0].replace(/<\?xml[^>]*>/, '').trim();
  
    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
      parseTagValue: true,
    });
  
    try {
      const jsonData = parser.parse(cleanedXMLString);
      console.log('Parsed XML Data:', JSON.stringify(jsonData, null, 2)); // Log the parsed XML structure
  
      if (jsonData) {
        console.log('Parsed XML Data:', jsonData);
        const formattedData = formatGraphData(jsonData);
        if (formattedData) {
          setGraphData(formattedData);
        } else {
          console.error('No valid graph data after formatting.');
        }
      } else {
        console.error('No valid data found in XML.');
      }
    } catch (err) {
      console.error('Error parsing XML:', err);
    }
  };

  const formatGraphData = (root) => {
  const formatNode = (node, name = 'Root') => {
    const formattedNode = { name, children: [] };

    // Skip non-essential parts of the data like ?xml and #text
    if (node['#text'] || node['?xml']) {
      return null; // Skip if it's a non-relevant node
    }

    // Handle meeting structure
    if (node.meeting && node.meeting.topic) {
      const topics = Array.isArray(node.meeting.topic)
        ? node.meeting.topic
        : [node.meeting.topic];

      topics.forEach((topic, index) => {
        const topicName = topic['@_name'] || `Topic ${index + 1}`;
        const topicNode = {
          name: topicName,
          children: []
        };

        if (topic.description) {
          topicNode.children.push({ name: topic.description });
        }

        if (topic.subtopic) {
          const subtopics = Array.isArray(topic.subtopic)
            ? topic.subtopic
            : [topic.subtopic];

          subtopics.forEach((subtopic, subIndex) => {
            const subtopicName = subtopic['@_name'] || `Subtopic ${subIndex + 1}`;
            const subtopicNode = {
              name: subtopicName,
              children: []
            };

            if (subtopic.description) {
              subtopicNode.children.push({ name: subtopic.description });
            }

            if (subtopic.action_items && subtopic.action_items.item) {
              const items = Array.isArray(subtopic.action_items.item)
                ? subtopic.action_items.item
                : [subtopic.action_items.item];

              items.forEach((item, itemIndex) => {
                subtopicNode.children.push({
                  name: item,
                });
              });
            }

            topicNode.children.push(subtopicNode);
          });
        }

        formattedNode.children.push(topicNode);
      });

      return formattedNode;
    }

    // Fallback for other structures
    for (const key in node) {
      if (Object.hasOwnProperty.call(node, key)) {
        const childNode = node[key];
        if (typeof childNode === 'object' && childNode !== null) {
          const child = formatNode(childNode, key);
          if (child) formattedNode.children.push(child);
        } else if (childNode !== undefined && childNode !== null) {
          formattedNode.children.push({
            name: key,
            children: [{ name: String(childNode) }],
          });
        }
      }
    }
    return formattedNode;
  };

  return root ? [formatNode(root)] : null;
};

  // Function to fetch data from Gemini API
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
      const response = await axios.post('https://matrix-server-gzqd.vercel.app/sendXmlGraph', {
        uid,
        audioid,
        xmlData,
      });
      console.log('XML Graph Data Sent:', response.data);
    } catch (error) {
      console.error('Error sending XML Graph Data:', error.message);
    }
  };

  useEffect(() => {
    if (xmlData) {
      console.log('Using passed XML data:');
      formatXmlDataToGraph(xmlData);
      return; // Exit early if we have xmlData
    }
    
    if (transcription) {
      console.log('Generating new graph from transcription:');
      fetchGraphData(transcription);
    } else {
      console.error('No XML data or transcription found.');
    }
  }, [transcription, xmlData]);

  const formatXmlDataToGraph = (xmlData) => {
    const parser = new XMLParser();
    const jsonData = parser.parse(xmlData);
    const graphFormattedData = formatGraphData(jsonData);
    if (graphFormattedData) {
      setGraphData(graphFormattedData);
    }
  };

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
      <div id="chart" style="width: 100%; height: 900%;"></div>
      <script>
        const chartDom = document.getElementById('chart');
        const myChart = echarts.init(chartDom);
        const option = {
          tooltip: { trigger: 'item', triggerOn: 'mousemove' },
          series: [{
            type: 'tree',
            data: ${JSON.stringify(graphData)},
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
                const maxLength = 150;
                const text = params.name;
                if (text.length > maxLength) {
                  return text.substring(0, maxLength) + '...';
                }
                return text;
              }
            },
            leaves: {
              label: {
                position: 'right',
                verticalAlign: 'middle',
                align: 'left',
              },
            },
            emphasis: { focus: 'descendant' },
            expandAndCollapse: true,
            initialTreeDepth: 3,
          }],
        };
        myChart.setOption(option);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: chartHtml }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={{ flex: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
