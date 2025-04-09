// ChatBot.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Modal } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllStocks, getAllMedicines, initDatabase } from '../db/database';
import Markdown from 'react-native-markdown-display';
import { context } from '../db/language';
import { getLocales } from 'expo-localization';
import { GEMINI_API_KEY } from '@env';

const ChatBot = ({ visible, onClose }) => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const generatePrompt = async () => {
    await initDatabase();
    const medicineDB = await getAllMedicines();
    const currentStock = await getAllStocks();
    const basePrompt = `Pharmaceutical Inventory Assistant

Role: Your role is to serve as a Pharmaceutical Inventory Manager, responsible for verifying medicine stock levels and providing accurate information about various medications based on database (DB) entries.

Objectives:
1. Accurately check and report current stock levels of requested medications.
2. Provide detailed information regarding medication usage, dosage, side effects, interactions, and storage conditions.
3. Retrieve and interpret data from the medication database to answer user inquiries precisely.
4. Proactively notify the user if stock levels of any requested medication are low or depleted.

Instructions:
- Always cross-check medication information and inventory levels directly from the provided database before responding.
- Respond clearly and succinctly, ensuring that information provided is relevant, precise, and easy to understand.
- If information requested by the user is not available in the database, explicitly mention this and suggest alternative ways to acquire the necessary details.
- When communicating medication details, include critical warnings, dosage limitations, or special storage instructions when applicable.

Interaction Example:
User: "Could you please check the current stock level of Ibuprofen 200mg tablets?"
Assistant: "The current stock level for Ibuprofen 200mg tablets is 250 units. This medication should be stored at room temperature, away from direct sunlight and moisture. Recommended dosage for adults is typically 1-2 tablets every 4-6 hours as needed. Do not exceed 6 tablets in a 24-hour period. Would you like additional information or assistance with another medication?"

the output should be in ${getLocales()[0].languageRegionCode}
medicineDB: ${JSON.stringify(medicineDB)}
currentStock: ${JSON.stringify(currentStock)}
cuurent time ${new Date()}
`;
    console.log(basePrompt);
    return basePrompt;
  };

  const genMessage = (role, text) => {
    return { role, parts: [{ text }] };
  };

  const [messages, setMessages] = useState([
    genMessage('model', context.CHATBOT_FIRSTMSG),
  ]);
  const [inputText, setInputText] = useState('');

  const modalScrollRef = useRef(null);

  useEffect(() => {
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;
    const inText = inputText;
    setInputText('');
    const userMessage = genMessage('user', inText);
    setMessages((prev) => [...prev, userMessage]);

    const chat = model.startChat({
      history: [genMessage('user', await generatePrompt()), ...messages],
    });

    try {
      const result = await chat.sendMessage(inText);
      const botResponse = result.response.text() || '응답을 받을 수 없습니다.';
      const botMessage = genMessage('model', botResponse);
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const botMessage = genMessage(
        'model',
        'API 호출 중 오류가 발생했습니다: ' + error
      );
      setMessages((prev) => [...prev, botMessage]);
    }
  };

  const renderChatContent = () => (
    <>
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={{ paddingBottom: 30 }}
        ref={modalScrollRef}
        onContentSizeChange={() =>
          modalScrollRef.current && modalScrollRef.current.scrollToEnd({ animated: true })
        }>
        {messages.map((item, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              item.role === 'model' ? styles.botMessage : styles.userMessage,
            ]}>
            <Markdown style={styles.messageText}>{item.parts[0].text}</Markdown>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={context.CHATBOT_SEND_IN}
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>{context.CHATBOT_SEND}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.expandedHeader}>
            <Text style={styles.expandedHeaderText}>{context.CHATBOT_NAME}</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="compress" size={24} color="black" />
            </TouchableOpacity>
          </View>
          {renderChatContent()}
        </View>
      </View>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#e1f5fe',
  },
  expandedHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  botMessage: {
    backgroundColor: '#e1f5fe',
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: '#c8e6c9',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  sendButtonText: {
    color: 'blue',
    fontSize: 16,
  },
});

export default ChatBot;
