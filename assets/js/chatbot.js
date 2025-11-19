/**
 * Chatbot Module
 * Rule-based chatbot for healthcare provider assistance
 * Supports Arabic, French, and English
 */

class Chatbot {
  constructor() {
    this.db = window.db;
    this.i18n = window.i18n || i18n;
    this.search = window.search || search;
    
    // Intent patterns for different languages
    this.intentPatterns = {
      // Find provider intents
      findProvider: {
        en: ['find', 'search', 'looking for', 'need', 'where', 'doctor', 'clinic', 'hospital', 'pharmacy', 'lab'],
        fr: ['trouver', 'chercher', 'cherche', 'besoin', 'où', 'docteur', 'clinique', 'hôpital', 'pharmacie', 'laboratoire'],
        ar: ['ابحث', 'أبحث', 'أريد', 'أين', 'طبيب', 'عيادة', 'مستشفى', 'صيدلية', 'مختبر', 'دكتور']
      },
      
      // Emergency intents
      emergency: {
        en: ['emergency', 'urgent', 'now', '24/7', 'immediate', 'asap'],
        fr: ['urgence', 'urgent', 'maintenant', '24/7', 'immédiat', 'tout de suite'],
        ar: ['طوارئ', 'عاجل', 'الآن', 'فوري', 'مستعجل']
      },
      
      // Hours/availability intents
      hours: {
        en: ['hours', 'open', 'close', 'available', 'when', 'time', 'schedule'],
        fr: ['heures', 'ouvert', 'fermé', 'disponible', 'quand', 'horaire'],
        ar: ['ساعات', 'مفتوح', 'مغلق', 'متاح', 'متى', 'وقت', 'مواعيد']
      },
      
      // Location intents
      location: {
        en: ['where', 'location', 'address', 'directions', 'map', 'how to get'],
        fr: ['où', 'emplacement', 'adresse', 'directions', 'carte', 'comment aller'],
        ar: ['أين', 'موقع', 'عنوان', 'اتجاهات', 'خريطة', 'كيف أصل']
      },
      
      // Accessibility intents
      accessibility: {
        en: ['wheelchair', 'accessible', 'disability', 'handicap'],
        fr: ['fauteuil roulant', 'accessible', 'handicap'],
        ar: ['كرسي متحرك', 'متاح', 'إعاقة', 'معاق']
      },
      
      // Home visit intents
      homeVisit: {
        en: ['home visit', 'house call', 'come to', 'visit home'],
        fr: ['visite à domicile', 'venir à', 'domicile'],
        ar: ['زيارة منزلية', 'يأتي للمنزل', 'في البيت']
      },
      
      // Greeting intents
      greeting: {
        en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
        fr: ['bonjour', 'salut', 'bonsoir'],
        ar: ['مرحبا', 'السلام عليكم', 'أهلا', 'صباح الخير', 'مساء الخير']
      },
      
      // Help intents
      help: {
        en: ['help', 'how', 'what can', 'assist', 'support'],
        fr: ['aide', 'comment', 'que peux', 'assister', 'support'],
        ar: ['مساعدة', 'كيف', 'ماذا يمكن', 'ساعد']
      },
      
      // Thanks intents
      thanks: {
        en: ['thank', 'thanks', 'appreciate'],
        fr: ['merci', 'remercie'],
        ar: ['شكرا', 'شكراً', 'متشكر']
      }
    };
    
    // Specialty keywords
    this.specialtyKeywords = {
      en: {
        cardiology: ['heart', 'cardiac', 'cardiology'],
        dentistry: ['teeth', 'dental', 'dentist'],
        pediatrics: ['child', 'children', 'pediatric', 'baby', 'kid'],
        dermatology: ['skin', 'dermatology'],
        orthopedics: ['bone', 'orthopedic', 'fracture'],
        ophthalmology: ['eye', 'vision', 'ophthalmology'],
        gynecology: ['women', 'gynecology', 'pregnancy']
      },
      fr: {
        cardiology: ['cœur', 'cardiaque', 'cardiologie'],
        dentistry: ['dents', 'dentaire', 'dentiste'],
        pediatrics: ['enfant', 'pédiatrique', 'bébé'],
        dermatology: ['peau', 'dermatologie'],
        orthopedics: ['os', 'orthopédique', 'fracture'],
        ophthalmology: ['œil', 'vision', 'ophtalmologie'],
        gynecology: ['femmes', 'gynécologie', 'grossesse']
      },
      ar: {
        cardiology: ['قلب', 'قلبية', 'قلب'],
        dentistry: ['أسنان', 'طبيب أسنان'],
        pediatrics: ['أطفال', 'طفل', 'رضيع'],
        dermatology: ['جلد', 'جلدية'],
        orthopedics: ['عظام', 'كسر'],
        ophthalmology: ['عين', 'بصر', 'عيون'],
        gynecology: ['نساء', 'حمل', 'نسائية']
      }
    };
  }

  /**
   * Send message and get response
   * @param {string} message - User message
   * @param {string} language - Language code (ar, fr, en)
   * @returns {Promise<Object>} - Response object with text and suggestions
   */
  async sendMessage(message, language = null) {
    // Track chatbot response time
    const stopTracking = window.PerformanceMonitoring 
      ? window.PerformanceMonitoring.startTrace('chatbot_message_processing')
      : null;
    
    try {
      // Detect language if not provided
      if (!language) {
        language = this.i18n.getCurrentLanguage();
      }

      // Try to use Cloud Function if available
      if (this.useCloudFunction()) {
        try {
          // Track API call to Cloud Function
          const stopAPITracking = window.PerformanceMonitoring 
            ? window.PerformanceMonitoring.trackAPICall('/processChatbotMessage', 'POST')
            : null;
          
          const response = await this.sendMessageToCloudFunction(message, language);
          
          if (stopAPITracking) stopAPITracking(true);
          if (stopTracking) window.PerformanceMonitoring.stopTrace('chatbot_message_processing');
          
          return response;
        } catch (cloudError) {
          console.warn('Cloud Function unavailable, using client-side processing:', cloudError);
          // Fall through to client-side processing
        }
      }

      // Client-side processing (fallback)
      // Detect intent
      const intent = this.detectIntent(message, language);

      // Get response based on intent
      const response = await this.getResponse(intent, message, language);

      // Track chatbot interaction in analytics
      if (window.Analytics) {
        window.Analytics.trackChatbotMessage(message, intent, language);
      }

      // Stop performance tracking
      if (stopTracking) window.PerformanceMonitoring.stopTrace('chatbot_message_processing');

      return response;
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Stop performance tracking on error
      if (stopTracking) window.PerformanceMonitoring.stopTrace('chatbot_message_processing');
      
      return this.getErrorResponse(language);
    }
  }

  /**
   * Check if Cloud Function should be used
   * @returns {boolean}
   */
  useCloudFunction() {
    // Check if Firebase Functions is available
    return typeof firebase !== 'undefined' && 
           firebase.functions && 
           typeof firebase.functions === 'function';
  }

  /**
   * Send message to Cloud Function
   * @param {string} message - User message
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Response from Cloud Function
   */
  async sendMessageToCloudFunction(message, language) {
    const functions = firebase.functions();
    const processChatbotMessage = functions.httpsCallable('processChatbotMessage');
    
    const result = await processChatbotMessage({ message, language });
    return result.data;
  }

  /**
   * Detect user intent from message
   * @param {string} message - User message
   * @param {string} language - Language code
   * @returns {Object} - Intent object with type and confidence
   */
  detectIntent(message, language) {
    const lowerMessage = message.toLowerCase().trim();
    const intents = [];

    // Check each intent pattern
    for (const [intentType, patterns] of Object.entries(this.intentPatterns)) {
      const languagePatterns = patterns[language] || patterns.en;
      
      let matches = 0;
      for (const pattern of languagePatterns) {
        if (lowerMessage.includes(pattern.toLowerCase())) {
          matches++;
        }
      }

      if (matches > 0) {
        intents.push({
          type: intentType,
          confidence: matches / languagePatterns.length
        });
      }
    }

    // Sort by confidence
    intents.sort((a, b) => b.confidence - a.confidence);

    // Return highest confidence intent or unknown
    return intents.length > 0 
      ? intents[0] 
      : { type: 'unknown', confidence: 0 };
  }

  /**
   * Get response based on intent
   * @param {Object} intent - Detected intent
   * @param {string} message - Original message
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Response object
   */
  async getResponse(intent, message, language) {
    const intentType = intent.type;

    switch (intentType) {
      case 'greeting':
        return this.getGreetingResponse(language);
      
      case 'help':
        return this.getHelpResponse(language);
      
      case 'thanks':
        return this.getThanksResponse(language);
      
      case 'emergency':
        return await this.getEmergencyResponse(language);
      
      case 'findProvider':
        return await this.getFindProviderResponse(message, language);
      
      case 'hours':
        return this.getHoursResponse(language);
      
      case 'location':
        return this.getLocationResponse(language);
      
      case 'accessibility':
        return await this.getAccessibilityResponse(language);
      
      case 'homeVisit':
        return await this.getHomeVisitResponse(language);
      
      default:
        return this.getUnknownResponse(language);
    }
  }

  /**
   * Get greeting response
   */
  getGreetingResponse(language) {
    const responses = {
      en: "Hello! I'm here to help you find healthcare providers in Sidi Bel Abbès. You can ask me about doctors, clinics, hospitals, pharmacies, or labs. How can I assist you today?",
      fr: "Bonjour ! Je suis là pour vous aider à trouver des prestataires de soins de santé à Sidi Bel Abbès. Vous pouvez me poser des questions sur les médecins, les cliniques, les hôpitaux, les pharmacies ou les laboratoires. Comment puis-je vous aider aujourd'hui ?",
      ar: "مرحباً! أنا هنا لمساعدتك في العثور على مقدمي الرعاية الصحية في سيدي بلعباس. يمكنك أن تسألني عن الأطباء أو العيادات أو المستشفيات أو الصيدليات أو المختبرات. كيف يمكنني مساعدتك اليوم؟"
    };

    return {
      text: responses[language] || responses.en,
      suggestions: this.getQuickReplies(language)
    };
  }

  /**
   * Get help response
   */
  getHelpResponse(language) {
    const responses = {
      en: "I can help you with:\n• Finding doctors, clinics, hospitals, pharmacies, or labs\n• Emergency services (24/7 available)\n• Providers with wheelchair accessibility\n• Providers offering home visits\n• Operating hours and locations\n\nJust ask me what you need!",
      fr: "Je peux vous aider avec :\n• Trouver des médecins, cliniques, hôpitaux, pharmacies ou laboratoires\n• Services d'urgence (disponibles 24h/24 et 7j/7)\n• Prestataires accessibles en fauteuil roulant\n• Prestataires proposant des visites à domicile\n• Horaires d'ouverture et emplacements\n\nDemandez-moi simplement ce dont vous avez besoin !",
      ar: "يمكنني مساعدتك في:\n• العثور على الأطباء والعيادات والمستشفيات والصيدليات أو المختبرات\n• خدمات الطوارئ (متاحة 24/7)\n• مقدمي الخدمة مع إمكانية الوصول بالكراسي المتحركة\n• مقدمي الخدمة الذين يقدمون زيارات منزلية\n• ساعات العمل والمواقع\n\nفقط اسألني عما تحتاجه!"
    };

    return {
      text: responses[language] || responses.en,
      suggestions: this.getQuickReplies(language)
    };
  }

  /**
   * Get thanks response
   */
  getThanksResponse(language) {
    const responses = {
      en: "You're welcome! Is there anything else I can help you with?",
      fr: "De rien ! Y a-t-il autre chose que je puisse faire pour vous ?",
      ar: "على الرحب والسعة! هل هناك أي شيء آخر يمكنني مساعدتك به؟"
    };

    return {
      text: responses[language] || responses.en,
      suggestions: this.getQuickReplies(language)
    };
  }

  /**
   * Get emergency response with 24/7 providers
   */
  async getEmergencyResponse(language) {
    try {
      const providers = await this.search.getEmergencyProviders();
      
      const responses = {
        en: `I found ${providers.length} emergency healthcare providers available 24/7:`,
        fr: `J'ai trouvé ${providers.length} prestataires de soins d'urgence disponibles 24h/24 et 7j/7 :`,
        ar: `وجدت ${providers.length} من مقدمي الرعاية الصحية الطارئة المتاحين على مدار الساعة:`
      };

      return {
        text: responses[language] || responses.en,
        providers: providers.slice(0, 5),
        action: 'showProviders'
      };
    } catch (error) {
      console.error('Error getting emergency providers:', error);
      return this.getErrorResponse(language);
    }
  }

  /**
   * Get find provider response
   */
  async getFindProviderResponse(message, language) {
    try {
      // Extract specialty from message
      const specialty = this.extractSpecialty(message, language);
      
      // Search for providers
      const searchParams = {};
      
      if (specialty) {
        searchParams.query = specialty;
      }

      const results = await this.search.searchProviders(searchParams);
      
      if (results.providers.length === 0) {
        const responses = {
          en: "I couldn't find any providers matching your request. Try searching for doctors, clinics, hospitals, pharmacies, or labs.",
          fr: "Je n'ai trouvé aucun prestataire correspondant à votre demande. Essayez de rechercher des médecins, des cliniques, des hôpitaux, des pharmacies ou des laboratoires.",
          ar: "لم أتمكن من العثور على أي مقدمي خدمة يطابقون طلبك. حاول البحث عن الأطباء أو العيادات أو المستشفيات أو الصيدليات أو المختبرات."
        };

        return {
          text: responses[language] || responses.en,
          suggestions: this.getQuickReplies(language)
        };
      }

      const responses = {
        en: `I found ${results.providers.length} healthcare providers for you:`,
        fr: `J'ai trouvé ${results.providers.length} prestataires de soins de santé pour vous :`,
        ar: `وجدت ${results.providers.length} من مقدمي الرعاية الصحية لك:`
      };

      return {
        text: responses[language] || responses.en,
        providers: results.providers.slice(0, 5),
        action: 'showProviders'
      };
    } catch (error) {
      console.error('Error finding providers:', error);
      return this.getErrorResponse(language);
    }
  }

  /**
   * Get hours response
   */
  getHoursResponse(language) {
    const responses = {
      en: "To see operating hours for a specific provider, please search for them and view their profile. You can also filter for 24/7 emergency services if you need immediate care.",
      fr: "Pour voir les heures d'ouverture d'un prestataire spécifique, veuillez le rechercher et consulter son profil. Vous pouvez également filtrer les services d'urgence 24h/24 et 7j/7 si vous avez besoin de soins immédiats.",
      ar: "لمعرفة ساعات العمل لمقدم خدمة معين، يرجى البحث عنه وعرض ملفه الشخصي. يمكنك أيضًا تصفية خدمات الطوارئ على مدار الساعة إذا كنت بحاجة إلى رعاية فورية."
    };

    return {
      text: responses[language] || responses.en,
      suggestions: [
        { text: language === 'ar' ? 'خدمات الطوارئ' : language === 'fr' ? 'Services d\'urgence' : 'Emergency services', action: 'emergency' }
      ]
    };
  }

  /**
   * Get location response
   */
  getLocationResponse(language) {
    const responses = {
      en: "To see the location and get directions to a provider, please search for them and view their profile. Each profile includes an interactive map showing their exact location.",
      fr: "Pour voir l'emplacement et obtenir des directions vers un prestataire, veuillez le rechercher et consulter son profil. Chaque profil comprend une carte interactive montrant leur emplacement exact.",
      ar: "لمعرفة الموقع والحصول على الاتجاهات إلى مقدم الخدمة، يرجى البحث عنه وعرض ملفه الشخصي. يتضمن كل ملف شخصي خريطة تفاعلية توضح موقعه الدقيق."
    };

    return {
      text: responses[language] || responses.en,
      suggestions: this.getQuickReplies(language)
    };
  }

  /**
   * Get accessibility response
   */
  async getAccessibilityResponse(language) {
    try {
      const results = await this.search.searchProviders({
        filters: { accessibility: true }
      });

      const responses = {
        en: `I found ${results.providers.length} wheelchair-accessible healthcare providers:`,
        fr: `J'ai trouvé ${results.providers.length} prestataires de soins de santé accessibles en fauteuil roulant :`,
        ar: `وجدت ${results.providers.length} من مقدمي الرعاية الصحية الذين يمكن الوصول إليهم بالكراسي المتحركة:`
      };

      return {
        text: responses[language] || responses.en,
        providers: results.providers.slice(0, 5),
        action: 'showProviders'
      };
    } catch (error) {
      console.error('Error getting accessible providers:', error);
      return this.getErrorResponse(language);
    }
  }

  /**
   * Get home visit response
   */
  async getHomeVisitResponse(language) {
    try {
      const results = await this.search.searchProviders({
        filters: { homeVisits: true }
      });

      const responses = {
        en: `I found ${results.providers.length} healthcare providers offering home visits:`,
        fr: `J'ai trouvé ${results.providers.length} prestataires de soins de santé proposant des visites à domicile :`,
        ar: `وجدت ${results.providers.length} من مقدمي الرعاية الصحية الذين يقدمون زيارات منزلية:`
      };

      return {
        text: responses[language] || responses.en,
        providers: results.providers.slice(0, 5),
        action: 'showProviders'
      };
    } catch (error) {
      console.error('Error getting home visit providers:', error);
      return this.getErrorResponse(language);
    }
  }

  /**
   * Get unknown intent response
   */
  getUnknownResponse(language) {
    const responses = {
      en: "I'm not sure I understand. I can help you find healthcare providers, emergency services, or answer questions about accessibility and home visits. What would you like to know?",
      fr: "Je ne suis pas sûr de comprendre. Je peux vous aider à trouver des prestataires de soins de santé, des services d'urgence ou répondre à des questions sur l'accessibilité et les visites à domicile. Que voudriez-vous savoir ?",
      ar: "لست متأكدًا من أنني أفهم. يمكنني مساعدتك في العثور على مقدمي الرعاية الصحية أو خدمات الطوارئ أو الإجابة على أسئلة حول إمكانية الوصول والزيارات المنزلية. ماذا تريد أن تعرف؟"
    };

    return {
      text: responses[language] || responses.en,
      suggestions: this.getQuickReplies(language)
    };
  }

  /**
   * Get error response
   */
  getErrorResponse(language) {
    const responses = {
      en: "I'm sorry, I encountered an error. Please try again or use the search function to find providers.",
      fr: "Je suis désolé, j'ai rencontré une erreur. Veuillez réessayer ou utiliser la fonction de recherche pour trouver des prestataires.",
      ar: "أنا آسف، واجهت خطأ. يرجى المحاولة مرة أخرى أو استخدام وظيفة البحث للعثور على مقدمي الخدمة."
    };

    return {
      text: responses[language] || responses.en,
      error: true
    };
  }

  /**
   * Extract specialty from message
   */
  extractSpecialty(message, language) {
    const lowerMessage = message.toLowerCase();
    const specialties = this.specialtyKeywords[language] || this.specialtyKeywords.en;

    for (const [specialty, keywords] of Object.entries(specialties)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          return specialty;
        }
      }
    }

    return null;
  }

  /**
   * Get quick reply suggestions
   */
  getQuickReplies(language) {
    const replies = {
      en: [
        { text: 'Find a doctor', action: 'findDoctor' },
        { text: 'Emergency services', action: 'emergency' },
        { text: 'Wheelchair accessible', action: 'accessibility' },
        { text: 'Home visits', action: 'homeVisit' }
      ],
      fr: [
        { text: 'Trouver un médecin', action: 'findDoctor' },
        { text: 'Services d\'urgence', action: 'emergency' },
        { text: 'Accessible en fauteuil roulant', action: 'accessibility' },
        { text: 'Visites à domicile', action: 'homeVisit' }
      ],
      ar: [
        { text: 'ابحث عن طبيب', action: 'findDoctor' },
        { text: 'خدمات الطوارئ', action: 'emergency' },
        { text: 'متاح للكراسي المتحركة', action: 'accessibility' },
        { text: 'زيارات منزلية', action: 'homeVisit' }
      ]
    };

    return replies[language] || replies.en;
  }

  /**
   * Suggest providers based on context
   * @param {Object} context - Context information
   * @returns {Promise<Array>} - Suggested providers
   */
  async suggestProviders(context = {}) {
    try {
      const { specialty, location, filters } = context;

      const searchParams = {
        query: specialty || '',
        location: location || '',
        filters: filters || {}
      };

      const results = await this.search.searchProviders(searchParams);
      return results.providers.slice(0, 5);
    } catch (error) {
      console.error('Error suggesting providers:', error);
      return [];
    }
  }
}

// Create and export chatbot instance
const chatbot = new Chatbot();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = chatbot;
}
