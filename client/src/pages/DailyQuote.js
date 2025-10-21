// src/pages/DailyQuote.js
import React, { useState, useEffect } from 'react';
import '../styles/DailyQuote.css'; // We'll create this CSS file

const quotes = [
  // English Quotes
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    type: "quote",
    language: "english"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    type: "quote",
    language: "english"
  },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown",
    type: "quote",
    language: "english"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    type: "quote",
    language: "english"
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
    type: "quote",
    language: "english"
  },

  // Hindi Quotes
  {
    text: "कर्म करो, फल की चिंता मत करो।",
    author: "Bhagavad Gita",
    translation: "Do your duty without expecting rewards.",
    type: "quote",
    language: "hindi"
  },
  {
    text: "हार मान लेना सबसे बड़ी असफलता है।",
    author: "APJ Abdul Kalam",
    translation: "Giving up is the biggest failure.",
    type: "quote",
    language: "hindi"
  },
  {
    text: "सपने वो नहीं जो आप सोते समय देखते हैं, सपने वो हैं जो आपको सोने नहीं देते।",
    author: "Abdul Kalam",
    translation: "Dreams are not what you see while sleeping, dreams are what don't let you sleep.",
    type: "quote",
    language: "hindi"
  },
  {
    text: "संघर्ष ही जीवन है।",
    author: "Swami Vivekananda",
    translation: "Struggle is life.",
    type: "quote",
    language: "hindi"
  },

  // More English Quotes
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    type: "quote",
    language: "english"
  },
  {
    text: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
    type: "quote",
    language: "english"
  },
  {
    text: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair",
    type: "quote",
    language: "english"
  }
];

const jokes = [
  // English Jokes
  {
    text: "Why don't scientists trust atoms? Because they make up everything!",
    type: "joke",
    language: "english"
  },
  {
    text: "I told my computer I needed a break, and now it won't stop sending me KitKat ads.",
    type: "joke",
    language: "english"
  },
  {
    text: "Why did the scarecrow win an award? Because he was outstanding in his field.",
    type: "joke",
    language: "english"
  },
  {
    text: "Parallel lines have so much in common. It's a shame they'll never meet.",
    type: "joke",
    language: "english"
  },

  // Hindi Jokes
  {
    text: "टीचर: बताओ, 2 और 2 कितने होते हैं? छात्र: 4 टीचर: बहुत अच्छा! छात्र: बहुत अच्छा? अब आप बताइए, 4 और 4 कितने होते हैं?",
    translation: "Teacher: Tell me, what is 2 and 2? Student: 4 Teacher: Very good! Student: Very good? Now you tell me, what is 4 and 4?",
    type: "joke",
    language: "hindi"
  },
  {
    text: "पत्नी: तुम मुझसे इतना प्यार क्यों करते हो? पति: क्योंकि तुम्हारे पापा अमीर हैं!",
    translation: "Wife: Why do you love me so much? Husband: Because your father is rich!",
    type: "joke",
    language: "hindi"
  },
  {
    text: "बेटा: पापा, आपके जमाने में पढ़ाई कैसे करते थे? पापा: बिना Google के बेटा, बिना Google के!",
    translation: "Son: Dad, how did you study in your time? Dad: Without Google son, without Google!",
    type: "joke",
    language: "hindi"
  },
  {
    text: "पति: तुम्हारे लिए मैं कुछ भी कर सकता हूँ! पत्नी: फिर आज खाना तुम ही बना लो।",
    translation: "Husband: I can do anything for you! Wife: Then you cook today.",
    type: "joke",
    language: "hindi"
  }
];

function DailyQuote() {
  const [content, setContent] = useState(null);
  const [isQuote, setIsQuote] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    showRandomContent();
  }, []);

  const showRandomContent = async () => {
    setIsLoading(true);
    setFade(false);
    
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const randomType = Math.random() > 0.5 ? 'quote' : 'joke';
    const collection = randomType === 'quote' ? quotes : jokes;
    const randomContent = collection[Math.floor(Math.random() * collection.length)];
    
    setContent(randomContent);
    setIsQuote(randomType === 'quote');
    setFade(true);
    setIsLoading(false);
  };

  const getIcon = () => {
    if (isQuote) {
      return content?.language === 'hindi' ? '📖' : '💫';
    }
    return content?.language === 'hindi' ? '😄' : '😂';
  };

  const getTypeText = () => {
    if (isQuote) {
      return content?.language === 'hindi' ? 'प्रेरणादायक विचार' : 'Motivational Quote';
    }
    return content?.language === 'hindi' ? 'मजेदार जोक' : 'Funny Joke';
  };

  return (
    <div className="daily-quote-container">
      <div className="quote-header">
        <h1 className="quote-title">
          <span className="quote-icon">💡</span>
          Daily Dose of Inspiration
        </h1>
        <p className="quote-subtitle">Get your daily motivation or laugh with our curated collection</p>
      </div>

      <div className="content-card">
        <div className="content-type-indicator">
          <span className="type-icon">{getIcon()}</span>
          <span className="type-text">{getTypeText()}</span>
          <span className="language-badge">
            {content?.language === 'hindi' ? 'हिंदी' : 'English'}
          </span>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your daily inspiration...</p>
          </div>
        ) : (
          <div className={`content-display ${fade ? 'fade-in' : 'fade-out'}`}>
            {content && (
              <>
                <div className="content-text">
                  {content.text}
                </div>
                
                {content.translation && (
                  <div className="translation">
                    <span className="translation-label">Translation:</span>
                    {content.translation}
                  </div>
                )}
                
                {content.author && (
                  <div className="author">
                    — {content.author}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="action-buttons">
          <button 
            onClick={showRandomContent}
            className="next-button"
            disabled={isLoading}
          >
            <span className="button-icon">🎲</span>
            {isLoading ? 'Loading...' : 'Show Another'}
          </button>
          
          <div className="content-toggle">
            <button 
              className={`toggle-btn ${isQuote ? 'active' : ''}`}
              onClick={() => {
                if (!isQuote) {
                  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                  setContent(randomQuote);
                  setIsQuote(true);
                }
              }}
            >
              💫 Quotes
            </button>
            <button 
              className={`toggle-btn ${!isQuote ? 'active' : ''}`}
              onClick={() => {
                if (isQuote) {
                  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                  setContent(randomJoke);
                  setIsQuote(false);
                }
              }}
            >
              😂 Jokes
            </button>
          </div>
        </div>

        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">{quotes.length + jokes.length}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{quotes.length}</span>
            <span className="stat-label">Quotes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{jokes.length}</span>
            <span className="stat-label">Jokes</span>
          </div>
        </div>
      </div>

      <div className="inspiration-footer">
        <p>💖 Made with love to brighten your day!</p>
      </div>
    </div>
  );
}

export default DailyQuote;