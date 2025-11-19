# 🚀 Guide de Démarrage Rapide - CityHealth

## ⚡ Démarrage en 5 Minutes

### Prérequis

- **Node.js** (v18 ou supérieur) - [Télécharger ici](https://nodejs.org/)
- Un navigateur moderne (Chrome, Firefox, Edge, Safari)
- Un éditeur de code (VS Code recommandé)

---

## 📦 Installation

### Étape 1: Installer Node.js

```bash
# Vérifier si Node.js est déjà installé
node --version
npm --version

# Si non installé, télécharger depuis:
# https://nodejs.org/ (version LTS recommandée)
```

### Étape 2: Installer les dépendances

```bash
# Dans le dossier du projet
npm ci
```

---

## 🏃 Lancer l'Application

### Option 1: Serveur Node.js (Recommandé)

```bash
node dev-server.js
```

Puis ouvrir: **http://localhost:3000/**

### Option 2: Firebase Hosting (Après configuration)

```bash
npm install -g firebase-tools
firebase serve
```

Puis ouvrir: **http://localhost:5000/**

### Option 3: Python SimpleHTTPServer

```bash
python -m http.server 3000
```

Puis ouvrir: **http://localhost:3000/**

---

## ✅ Vérification Rapide

Après avoir lancé le serveur, ouvrez la console du navigateur (F12) et vérifiez:

### ✓ Messages attendus (succès)

```
✓ Component loaded: /components/navbar.html
✓ Component loaded: /components/footer.html
✓ All core components loaded
✓ Theme initialized: light
✓ i18n initialized: en
✓ Router initialized
✓ Application initialized successfully
```

### ⚠️ Warnings acceptables

```
⚠️ Using placeholder Firebase config. Please configure your Firebase project.
⚠️ Auth module not loaded (normal si Firebase non configuré)
```

### ❌ Erreurs à corriger

Si vous voyez ces erreurs:
- `404 /components/navbar.html` → Vérifier que le serveur sert bien les fichiers
- `router.js:73 Uncaught SyntaxError` → Le fichier router.js est corrompu
- `Firebase not initialized` → Normal si Firebase non configuré

---

## 🧪 Tests de Fonctionnalité

### Test 1: Navigation

1. Cliquer sur "Search" dans le menu
2. L'URL doit changer vers `/search`
3. La page ne doit PAS se recharger (SPA)
4. Le contenu doit changer

### Test 2: Changement de Langue

1. Cliquer sur le sélecteur de langue (🌐)
2. Choisir "العربية" (Arabe)
3. L'interface doit se traduire
4. La direction du texte doit passer en RTL

### Test 3: Toggle Thème

1. Cliquer sur l'icône lune/soleil
2. Le thème doit basculer entre clair et sombre
3. La préférence doit être sauvegardée (localStorage)

### Test 4: Responsive

1. Ouvrir les DevTools (F12)
2. Activer le mode responsive (Ctrl+Shift+M)
3. Tester sur différentes tailles d'écran
4. Le menu mobile doit apparaître sur petit écran

---

## 🔧 Configuration Firebase (Optionnel)

Pour activer les fonctionnalités complètes (authentification, base de données):

### 1. Créer un Projet Firebase

1. Aller sur https://console.firebase.google.com/
2. Cliquer sur "Ajouter un projet"
3. Suivre les étapes de création

### 2. Activer les Services

Dans la console Firebase:
- **Authentication** → Activer Email/Password et Google
- **Firestore Database** → Créer une base de données (mode test)
- **Storage** → Activer le stockage
- **Hosting** → Optionnel pour le déploiement

### 3. Copier la Configuration

1. Dans les paramètres du projet → Général
2. Faire défiler jusqu'à "Vos applications"
3. Cliquer sur l'icône Web (</>)
4. Copier l'objet `firebaseConfig`

### 4. Mettre à Jour le Code

Ouvrir `assets/js/firebase-config.js` et remplacer:

```javascript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

### 5. Déployer les Règles de Sécurité

```bash
firebase deploy --only firestore,storage
```

---

## 🐛 Dépannage

### Problème: "npm n'est pas reconnu"

**Solution**: Node.js n'est pas installé ou pas dans le PATH
1. Installer Node.js depuis https://nodejs.org/
2. Redémarrer le terminal
3. Vérifier: `node --version`

### Problème: "Cannot GET /search"

**Solution**: Le serveur ne gère pas le routing SPA
1. Utiliser `node dev-server.js` au lieu de `python -m http.server`
2. Ou configurer Firebase Hosting avec les rewrites

### Problème: Navbar/Footer ne s'affichent pas

**Solution**: Components loader non chargé
1. Vérifier que `components-loader.js` existe dans `assets/js/`
2. Vérifier qu'il est chargé dans `index.html` (ligne ~85)
3. Vérifier la console pour les erreurs 404

### Problème: Erreur "Firebase not initialized"

**Solution**: Normal si Firebase non configuré
1. Soit configurer Firebase (voir ci-dessus)
2. Soit ignorer (l'app fonctionne en mode démo)

### Problème: Images manquantes

**Solution**: Utiliser les placeholders SVG
1. Vérifier que `assets/images/default-provider.svg` existe
2. Vérifier que `assets/images/icon.svg` existe
3. Ou créer vos propres images

---

## 📚 Ressources Utiles

### Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Leaflet Maps Documentation](https://leafletjs.com/reference.html)

### Fichiers Importants

- `index.html` - Point d'entrée de l'application
- `assets/js/app.js` - Initialisation de l'application
- `assets/js/router.js` - Routeur SPA
- `assets/js/firebase-config.js` - Configuration Firebase
- `firebase.json` - Configuration Firebase Hosting

### Structure du Projet

```
CityHealth/
├── index.html                 # Point d'entrée
├── dev-server.js             # Serveur de développement
├── package.json              # Dépendances npm
├── firebase.json             # Config Firebase
├── pages/                    # Templates de pages
│   ├── home.html
│   ├── search-results.html
│   ├── auth.html
│   └── ...
├── components/               # Composants réutilisables
│   ├── navbar.html
│   ├── footer.html
│   └── ...
├── assets/
│   ├── js/                   # Modules JavaScript
│   │   ├── app.js
│   │   ├── router.js
│   │   ├── components-loader.js
│   │   └── ...
│   ├── css/                  # Feuilles de style
│   ├── images/               # Images et icônes
│   └── locales/              # Fichiers de traduction
└── functions/                # Cloud Functions (optionnel)
```

---

## 🎯 Prochaines Étapes

Après avoir vérifié que l'application fonctionne:

1. **Personnaliser le contenu**
   - Modifier les textes dans `assets/locales/`
   - Ajouter vos propres images
   - Personnaliser les couleurs dans `assets/css/themes.css`

2. **Ajouter des données**
   - Configurer Firebase
   - Importer des providers depuis `initial-providers.csv`
   - Créer des comptes utilisateurs

3. **Déployer en production**
   - Configurer Firebase Hosting
   - Exécuter `npm run build`
   - Déployer avec `firebase deploy`

4. **Tester et optimiser**
   - Exécuter les tests: `npm test`
   - Vérifier les performances
   - Tester sur différents navigateurs

---

## 💡 Conseils

- **Développement**: Utilisez `node dev-server.js` pour un rechargement rapide
- **Production**: Utilisez `npm run build` pour optimiser les assets
- **Débogage**: Ouvrez toujours la console (F12) pour voir les erreurs
- **Git**: Committez régulièrement vos changements
- **Backup**: Sauvegardez votre configuration Firebase

---

## 🆘 Besoin d'Aide?

Si vous rencontrez des problèmes:

1. Vérifier la console du navigateur (F12)
2. Lire `ANALYSE_DECISIONNELLE.md` pour les problèmes connus
3. Consulter `CORRECTIFS_APPLIQUES.md` pour les solutions
4. Vérifier les logs du serveur dans le terminal

---

**Bon développement! 🚀**

*Guide créé le 15 novembre 2025*
