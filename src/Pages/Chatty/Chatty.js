// Chatty.jsx
import React, { useState, useEffect, useRef } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import './Chatty.css'; 

// Import Firebase database reference and functions
// NOTE: Adjust the path to your FirebaseConfig file
import { database } from '../../Service/FirebaseConfig'; 
import { ref, push, onValue } from 'firebase/database';

// Accepts currentUser prop to identify the sender
function Chatty({ isOpen, onClose, currentUser }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    
    // Ref to automatically scroll to the latest message
    const messagesEndRef = useRef(null); 
    
    const messagesRef = ref(database, 'messages');

    // Effect to fetch and listen for real-time updates
    useEffect(() => {
        if (!isOpen) return;

        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            const loadedMessages = [];
            
            if (data) {
                for (let id in data) {
                    loadedMessages.push({ id, ...data[id] });
                }
            }
            // Sort messages by timestamp to ensure correct order
            loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
            setMessages(loadedMessages);
        });

        // Cleanup function: remove the listener
        return () => unsubscribe();
    }, [isOpen]);

    // Effect to scroll to the bottom when messages load/update
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    // Function to handle sending the message
    const handleSendMessage = (e) => {
        e.preventDefault(); 

        const trimmedMessage = message.trim();

        if (trimmedMessage === '') {
            return; // Don't send empty messages
        }
        
        // Safety check: ensure a user is logged in
        if (!currentUser || !currentUser.uid) {
            alert("You must be logged in to send a message.");
            return; 
        }

        // Determine the username: Use displayName, then email, then a UID snippet as fallback
        const senderName = currentUser.displayName || 
                           currentUser.email || 
                     `User_${currentUser.uid.substring(0, 8)}`

        // 1. Create the message object
        const newMessage = {
            text: trimmedMessage,
            userId: currentUser.uid, // Store unique ID for differentiation
            user: senderName, // Store display name or fallback
            timestamp: Date.now(),
        };

        // 2. Use 'push' to add the message
        push(messagesRef, newMessage)
            .then(() => {
                setMessage(''); // Clear the input field
            })
            .catch((error) => {
                console.error("Error sending message: ", error);
            });
    };
    
    if (!isOpen) {
        return null;
    }

    // Function to check if the message sender is the current logged-in user
    const isCurrentUser = (msg) => currentUser && msg.userId === currentUser.uid;

    return (
        <div className="chat-modal-container">
            {/* Header section */}
            <div className="chat-modal-header">
                <span className="chat-title">
                    <span role="img" aria-label="chat-emoji">🟢</span> Chatty
                </span>
                <CloseIcon 
                    className="chat-close-icon" 
                    onClick={onClose}
                    aria-label="Close Chat"
                />
            </div>

            {/* Message Display Area */}
            <div className="chat-modal-body">
                <div className="message-list">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            // Add 'sent' or 'received' class based on sender
                            className={`chat-message ${isCurrentUser(msg) ? 'sent' : 'received'}`}
                        >
                            <div className="message-content">
                                {/* Only show the user name if it's NOT the current user */}
                                {!isCurrentUser(msg) && <strong>{msg.user}:</strong>}
                                
                                <p>{msg.text}</p>
                                
                                <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))}
                    {/* Empty div for auto-scrolling */}
                    <div ref={messagesEndRef} /> 
                </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input 
                    type="text" 
                    placeholder={currentUser ? "Type a message..." : "Log in to chat..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="message-input"
                    disabled={!currentUser} // Disable input if no user is logged in
                />
                <button 
                    type="submit" 
                    className="send-button" 
                    disabled={!currentUser || message.trim() === ''}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

export default Chatty;