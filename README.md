# Huntchapter

Ce projet est un générateur d'histoires interactives alimenté par l'IA de Google Gemini.

## Démarrage rapide

### Prérequis

- Node.js (version 20 ou supérieure recommandée)
- npm

### Installation

1.  Clonez le dépôt.
2.  Installez les dépendances :
    ```bash
    npm install
    ```

### Configuration de l'environnement

Le backend a besoin d'une clé d'API Google Gemini pour fonctionner.

1.  Allez dans le dossier `api`.
2.  Copiez le fichier `.env.example` et renommez la copie en `.env`.
    ```bash
    cp api/.env.example api/.env
    ```
3.  Ouvrez le fichier `api/.env` et remplacez `"VOTRE_CLE_API_ICI"` par votre véritable clé d'API Gemini.

### Lancer le serveur de développement

Une fois l'installation et la configuration terminées, vous pouvez lancer l'application en mode développement. Cette commande démarrera simultanément le frontend (Vite) et le backend (Express).

```bash
npm run dev
```

L'application sera accessible à l'adresse `http://localhost:5173`.
