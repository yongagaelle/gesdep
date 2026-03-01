# Guide de déploiement sur Vercel

## Méthode 1 : Via l'interface web Vercel (RECOMMANDÉ - Plus simple)

### Étape 1 : Préparer le projet
```bash
cd /home/yonga/Documents/Projets/GesDep
npm run build:web
```

### Étape 2 : Créer un compte Vercel
1. Allez sur https://vercel.com
2. Cliquez sur "Sign Up" (gratuit)
3. Connectez-vous avec GitHub, GitLab ou email

### Étape 3 : Déployer via l'interface
1. Cliquez sur "Add New Project"
2. Sélectionnez "Import Git Repository" OU "Deploy from CLI"
3. Si vous choisissez CLI, suivez les instructions

### Étape 4 : Configuration du projet
- **Framework Preset**: Other
- **Build Command**: `npm run build:web`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Étape 5 : Déployer
Cliquez sur "Deploy" et attendez 2-3 minutes.

---

## Méthode 2 : Via CLI (Alternative)

### Étape 1 : Installer Vercel localement (sans sudo)
```bash
cd /home/yonga/Documents/Projets/GesDep
npm install vercel --save-dev
```

### Étape 2 : Se connecter
```bash
npx vercel login
```

### Étape 3 : Déployer
```bash
npx vercel
```

### Étape 4 : Déployer en production
```bash
npx vercel --prod
```

---

## Méthode 3 : Via GitHub (Automatique)

### Étape 1 : Créer un repo GitHub
```bash
cd /home/yonga/Documents/Projets/GesDep
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/gesdep.git
git push -u origin main
```

### Étape 2 : Connecter à Vercel
1. Sur vercel.com, cliquez "Import Project"
2. Sélectionnez votre repo GitHub
3. Vercel détecte automatiquement la config
4. Cliquez "Deploy"

**Avantage**: Chaque push sur GitHub redéploie automatiquement !

---

## Mises à jour futures

### Via CLI:
```bash
npx vercel --prod
```

### Via GitHub:
```bash
git add .
git commit -m "Update"
git push
```

---

## URL finale
Vous obtiendrez une URL type: `https://gesdep.vercel.app`

## Domaine personnalisé (optionnel)
Dans Vercel Dashboard → Settings → Domains → Ajouter votre domaine

---

## Partager avec l'utilisateur iPhone
1. Envoyez l'URL: `https://votre-app.vercel.app`
2. Sur iPhone, ouvrir dans Safari
3. Cliquer sur "Partager" → "Sur l'écran d'accueil"
4. L'app s'installe comme une vraie app !
