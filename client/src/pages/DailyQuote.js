// src/pages/DailyQuote.js
import React, { useState, useEffect } from 'react';

const quotes = [
  // English Quotes
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "The harder you work for something, the greater you'll feel when you achieve it. - Unknown",
  "Your limitation—it's only your imagination. - Unknown",
  "Push yourself, because no one else is going to do it for you. - Unknown",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The secret of getting ahead is getting started. - Mark Twain",
  "It always seems impossible until it's done. - Nelson Mandela",
  "You are never too old to set another goal or to dream a new dream. - C.S. Lewis",
  
  // Hindi Quotes (with English translations)
  "कर्म करो, फल की चिंता मत करो। (Do your duty without expecting rewards.) - Bhagavad Gita",
  "हार मान लेना सबसे बड़ी असफलता है। (Giving up is the biggest failure.) - APJ Abdul Kalam",
  "सपने वो नहीं जो आप सोते समय देखते हैं, सपने वो हैं जो आपको सोने नहीं देते। (Dreams are not what you see while sleeping, dreams are what don't let you sleep.) - Abdul Kalam",
  "जीतने का सबसे अच्छा तरीका है खुद पर विश्वास रखना। (The best way to win is to believe in yourself.) - Unknown",
  "मुश्किलें हमें तोड़ने नहीं, बल्कि बनाने आती हैं। (Difficulties come not to break us but to make us.) - Unknown",
  "संघर्ष ही जीवन है। (Struggle is life.) - Swami Vivekananda",
  "अपने लक्ष्य को इतना बड़ा बना दो कि असफलता भी सफलता के बराबर हो जाए। (Make your goal so big that even failure equals success.) - Amitabh Bachchan",
  "जब तक आप खुद पर विश्वास नहीं करते, तब तक आप भगवान पर विश्वास नहीं कर सकते। (Until you believe in yourself, you can't believe in God.) - Swami Vivekananda",
  "सफलता उन्हीं को मिलती है जो सफल होने का साहस रखते हैं। (Success comes to those who dare to succeed.) - Unknown",
  "समय सबसे बड़ा शिक्षक है, बशर्ते हम सीखने को तैयार हों। (Time is the best teacher, provided we are willing to learn.) - Unknown",

  // More English Quotes
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "You miss 100% of the shots you don't take. - Wayne Gretzky",
  "Everything you've ever wanted is on the other side of fear. - George Addair",
  "Don't let yesterday take up too much of today. - Will Rogers",
  "The only limit to our realization of tomorrow is our doubts of today. - Franklin D. Roosevelt",
  
  // More Hindi Quotes
  "जीतने वाले अलग चीजें नहीं करते, वो चीजों को अलग तरह से करते हैं। (Winners don't do different things, they do things differently.) - Shiv Khera",
  "असफलता एक चुनौती है, स्वीकार करो। (Failure is a challenge, accept it.) - Unknown",
  "महानता कभी न गिरने में नहीं, बल्कि हर बार गिरकर उठने में है। (Greatness lies not in never falling, but in rising every time we fall.) - Unknown",
  "सफलता छोटे-छोटे प्रयासों का योग है जो रोज किया जाता है। (Success is the sum of small efforts repeated daily.) - Robert Collier",
  "अगर आप कुछ पाना चाहते हैं जो आपने कभी नहीं पाया, तो आपको कुछ करना होगा जो आपने कभी नहीं किया। (If you want something you've never had, you must be willing to do something you've never done.) - Unknown"
];

const jokes = [
  // English Jokes
  "Why don't scientists trust atoms? Because they make up everything!",
  "I told my computer I needed a break, and now it won't stop sending me KitKat ads.",
  "Why did the scarecrow win an award? Because he was outstanding in his field.",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "I would tell you a construction joke, but I'm still working on it.",
  "Why don't eggs tell jokes? They'd crack each other up.",
  "I'm reading a book about anti-gravity. It's impossible to put down!",
  "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.",
  "Why don't skeletons fight each other? They don't have the guts.",
  "I used to be a baker, but I couldn't make enough dough.",
  
  // Hindi Jokes (with English translations)
  "टीचर: बताओ, 2 और 2 कितने होते हैं? छात्र: 4 टीचर: बहुत अच्छा! छात्र: बहुत अच्छा? अब आप बताइए, 4 और 4 कितने होते हैं? (Teacher: Tell me, what is 2 and 2? Student: 4 Teacher: Very good! Student: Very good? Now you tell me, what is 4 and 4?)",
  "पत्नी: तुम मुझसे इतना प्यार क्यों करते हो? पति: क्योंकि तुम्हारे पापा अमीर हैं! (Wife: Why do you love me so much? Husband: Because your father is rich!)",
  "डॉक्टर: आपकी उम्र क्या है? मरीज: 35 साल डॉक्टर: और पत्नी की? मरीज: 7 साल डॉक्टर: क्या? मरीज: हाँ डॉक्टर साहब, शादी से पहले वो 28 साल की थी! (Doctor: What's your age? Patient: 35 years Doctor: And your wife's? Patient: 7 years Doctor: What? Patient: Yes doctor, before marriage she was 28!)",
  "बेटा: पापा, आपके जमाने में पढ़ाई कैसे करते थे? पापा: बिना Google के बेटा, बिना Google के! (Son: Dad, how did you study in your time? Dad: Without Google son, without Google!)",
  "पति: तुम्हारे लिए मैं कुछ भी कर सकता हूँ! पत्नी: फिर आज खाना तुम ही बना लो। (Husband: I can do anything for you! Wife: Then you cook today.)",
  
  // More English Jokes
  "Why did the bicycle fall over? Because it was two-tired!",
  "What do you call fake spaghetti? An impasta!",
  "How do you organize a space party? You planet!",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one!",
  "What's the best time to go to the dentist? Tooth-hurty!",
  
  // More Hindi Jokes
  "शादी से पहले लड़की: मैं तुम्हारे लिए खाना बनाऊँगी! शादी के बाद लड़की: जाओ बाहर से खाना मँगवा लो! (Before marriage girl: I'll cook for you! After marriage girl: Go order food from outside!)",
  "टीचर: अगर मैं तुम्हें 2 सेब दूँ और 2 सेब दूँ, तो कुल कितने सेब हुए? छात्र: 5 टीचर: कैसे? छात्र: मेरे पास पहले से 1 सेब है! (Teacher: If I give you 2 apples and 2 apples, how many total apples? Student: 5 Teacher: How? Student: I already have 1 apple!)",
  "पति: तुम मेरी जिंदगी की रोशनी हो! पत्नी: तो मैं बिजली का बिल भर दूँ? (Husband: You are the light of my life! Wife: Should I pay the electricity bill then?)",
  "बेटा: पापा, आप इतने सुंदर क्यों हैं? पापा: क्योंकि मैंने तुम्हारी मम्मी से शादी की है! (Son: Dad, why are you so handsome? Dad: Because I married your mom!)",
  "दोस्त 1: तुम्हारी बीवी तुम्हें क्या कहकर बुलाती है? दोस्त 2: वो मुझे 'अपना' कहकर बुलाती है! दोस्त 1: वाह! दोस्त 2: हाँ... अपना नालायक, अपना निकम्मा! (Friend 1: What does your wife call you? Friend 2: She calls me 'apna'! Friend 1: Wow! Friend 2: Yes... apna nalayak [useless], apna nikamma [good-for-nothing]!)"
];

function DailyQuote() {
  const [content, setContent] = useState('');
  const [isQuote, setIsQuote] = useState(true);

  useEffect(() => {
    showRandomContent();
  }, []);

  const showRandomContent = () => {
    if (Math.random() > 0.5) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setContent(randomQuote);
      setIsQuote(true);
    } else {
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      setContent(randomJoke);
      setIsQuote(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>{isQuote ? '🌟 Motivational Quote' : '😂 Joke of the Day'}</h2>
      <p style={styles.content}>{content}</p>
      <button onClick={showRandomContent} style={styles.button}>Show Another</button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    padding: '20px',
    border: '2px solid #4e54c8',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(78, 84, 200, 0.2)',
    background: 'cyan',
    textAlign: 'center'
  },
  content: {
    fontSize: '1.2rem',
    color: '#333',
    margin: '20px 0'
  },
  button: {
    background: 'linear-gradient(45deg, #4e54c8, #8f94fb)',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease'
  }
};

export default DailyQuote;
