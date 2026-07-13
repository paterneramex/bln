# EDITBLN

Application web développée avec **Django REST Framework** et **React (Vite)** permettant de consulter et d'interagir avec la base de données **DBDT**.

---

# Architecture

- **Backend** : Django + Django REST Framework
- **Authentification** : JWT
- **Frontend** : React (Vite) + Tailwind CSS
- **Base de données** : MySQL

> [!IMPORTANT]
> Les modèles Django ont été générés par reverse engineering à l'aide de la commande :
>
> ```bash
> python manage.py inspectdb
> ```
>
> Les tables existantes de la base de données **ne doivent pas être modifiées** par Django.

---

# Technologies utilisées

## Backend

- Python 3.13
- Django
- Django REST Framework
- JWT Authentication
- MySQL

## Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Leaflet
- React Leaflet
- xlsx

---

# Prérequis

- Python 3.13
- Node.js 24 ou supérieur
- npm
- MySQL

---

# Installation

## 1. Cloner le dépôt

```bash
git clone https://github.com/paterneramex/bln.git
cd bln
```

---

# Backend

Se placer dans le dossier du backend :

```bash
cd backend
```

## 1. Créer un environnement virtuel

```bash
python -m venv .venv
```

Activation :

**Windows**

```bash
.venv\Scripts\activate
```

**Linux / macOS**

```bash
source .venv/bin/activate
```

---

## 2. Installer les dépendances

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## 3. Configurer le fichier `.env`

Créer un fichier `.env` à côté du fichier `manage.py`.

Générer une clé secrète :

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Puis ajouter :

```env
DEBUG=True

SECRET_KEY=votre_cle_generee

DB_NAME=bln
DB_USER=root
DB_PASSWORD=123
DB_HOST=localhost
DB_PORT=3306
```

Adaptez les paramètres selon votre environnement.

---

## 4. Appliquer les migrations

```bash
python manage.py migrate
```

> Les migrations ne concernent que les modèles propres au projet. Les tables issues de `inspectdb` ne doivent pas être modifiées.

---

## 5. Créer un superutilisateur

```bash
python manage.py createsuperuser
```

---

## 6. Lancer le serveur

```bash
python manage.py runserver
```

Le backend sera disponible à l'adresse :

```
http://localhost:8000
```

---

# Frontend

Se placer dans le dossier :

```bash
cd frontend
```

## 1. Installer les dépendances

```bash
npm install
```

---

## 2. Configurer le fichier `.env`

Créer un fichier `.env` dans le dossier `frontend` :

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 3. Lancer le serveur de développement

```bash
npm run dev
```

Le frontend sera disponible à l'adresse :

```
http://localhost:5173
```

---

# Accès à l'application

| Service | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API REST | http://localhost:8000/api |
| Administration Django | http://localhost:8000/admin |

---

# Notes

- Les modèles Django ont été générés avec `python manage.py inspectdb`.
- Les tables existantes de la base MySQL ne doivent pas être modifiées.
- Les migrations Django ne concernent que les nouveaux modèles créés dans le projet.
- Le frontend communique avec le backend via l'API REST en utilisant Axios.
