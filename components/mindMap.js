import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OpenAI from 'openai';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const ForceDirectedGraph = ({ transcription, uid, audioid, xmlData }) => {
  const [graphData, setGraphData] = useState(null);
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
      const response = await axios.post('https://matrix-server-gzqd.vercel.app/sendXmlGraph', {
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
    <div id="chart" style="width: 100%; height: 900%;"></div>
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

      const option = {
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: [{
          type: 'tree',
          data: coloredGraphData,
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
            fontSize: 18
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
          force: {
            repulsion: 200, // Increase this value to push nodes further apart
            gravity: 0.1,   // Adjust gravity to control how tightly nodes are pulled together
            edgeLength: 100, // Adjust edge length to control the distance between connected nodes
            layoutAnimation: true, // Enable layout animation for smoother transitions
          },
          // Add vertical spacing between layers
          layerSpacing: 40, // Increase this value to add more vertical space between layers
          // Add horizontal spacing between nodes
          nodeSpacing: 20,  // Increase this value to add more horizontal space between nodes
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
