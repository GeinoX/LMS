#  Système de Gestion de Fichiers - School Management System

##  Vue d'ensemble

Ce système permet aux **Admins** et **Teachers** d'uploader des fichiers pour les subjects avec compression automatique, et permet aux **Admins**, **Teachers** et **Students** de télécharger ces fichiers.

##  Fonctionnalités

### Pour les Admins
- ✅ Upload de fichiers lors de la création de subjects
- ✅ Compression automatique des fichiers (images, PDF, vidéos, audio, etc.)
- ✅ Choix du niveau de compression (none, low, medium, high)
- ✅ Choix du mode de compression (individual, zip)
- ✅ Visualisation des fichiers uploadés
- ✅ Téléchargement des fichiers

### Pour les Teachers
- ✅ Upload de fichiers pour leur subject assigné
- ✅ Compression automatique des fichiers
- ✅ Gestion complète des fichiers (upload, download, delete)
- ✅ Interface dédiée avec design moderne
- ✅ Visualisation de tous les fichiers du subject

### Pour les Students
- ✅ Visualisation des fichiers de leurs subjects
- ✅ Téléchargement des fichiers
- ✅ Interface claire et intuitive

##  Technologies Utilisées

### Backend
- **Node.js** avec Express.js
- **Multer** pour l'upload de fichiers
- **MongoDB** pour le stockage des métadonnées
- Stockage physique dans `uploads/subjects/`

### Frontend
- **React.js** avec Material-UI
- **Compression Libraries:**
  - `browser-image-compression` - Compression d'images
  - `pdf-lib` - Compression de PDF
  - `@ffmpeg/ffmpeg` - Compression vidéo/audio
  - `jszip`, `pako`, `fflate` - Compression ZIP
  - `lamejs` - Compression audio MP3

##  Structure des Fichiers

### Backend

```
backend/
├── controllers/
│   └── subject-controller.js
│       ├── subjectCreate()           # Création de subjects avec fichiers
│       ├── addFilesToSubject()       # Ajout de fichiers (Teachers)
│       ├── deleteFileFromSubject()   # Suppression de fichiers
│       ├── downloadFile()            # Téléchargement de fichiers
│       └── getSubjectFiles()         # Récupération des fichiers
├── routes/
│   └── route.js
│       ├── POST /SubjectCreate
│       ├── POST /Subject/:id/files
│       ├── DELETE /Subject/:subjectId/file/:fileId
│       ├── GET /Subject/:id/files
│       └── GET /Subject/:subjectId/file/:fileId/download
├── models/
│   └── subjectSchema.js
│       └── fileSchema (embedded)
│           ├── originalName
│           ├── filename
│           ├── path
│           ├── size
│           ├── mimetype
│           ├── compressionLevel
│           ├── compressionMode
│           └── uploadedAt
└── utils/
    └── fileUpload.js               # Configuration Multer
```

### Frontend

```
frontend/src/
├── pages/
│   ├── admin/subjectRelated/
│   │   └── SubjectForm.js          # Upload pour Admins
│   └── teacher/
│       ├── TeacherSubjectFiles.js  # Gestion fichiers Teachers
│       ├── TeacherDashboard.js     # Routes
│       └── TeacherSideBar.js       # Navigation
├── components/
│   ├── FileUploadPerSubject.js     # Composant upload par subject
│   └── SubjectFiles.js             # Affichage et download
├── services/
│   └── FileUploadService.js        # Service de compression
│       ├── compressFiles()
│       ├── compressAllFilesAsZip()
│       ├── getFileCategory()
│       └── validateFiles()
└── styles/
    └── fileUploadStyles.js         # Styles modernes et animations
```

##  Utilisation

### 1. Admin - Créer un Subject avec Fichiers

1. Aller sur **Admin Dashboard** → **Subjects** → **Add Subject**
2. Remplir les informations du subject
3. Choisir le niveau de compression (none, low, medium, high)
4. Choisir le mode de compression (individual ou zip)
5. Uploader les fichiers via le composant d'upload
6. Cliquer sur **Submit**

### 2. Teacher - Gérer les Fichiers du Subject

1. Aller sur **Teacher Dashboard** → **Subject Files**
2. Voir tous les fichiers existants
3. Uploader de nouveaux fichiers:
   - Choisir le niveau de compression
   - Choisir le mode de compression
   - Sélectionner les fichiers
   - Cliquer sur **Upload**
4. Télécharger ou supprimer des fichiers existants

### 3. Student - Télécharger les Fichiers

1. Aller sur **Student Dashboard** → **Subjects**
2. Sélectionner un subject
3. Voir la liste des fichiers disponibles
4. Cliquer sur **Download** pour télécharger

## 🗜️ Système de Compression

### Niveaux de Compression

- **None**: Pas de compression (fichiers originaux)
- **Low**: Compression légère (qualité maximale)
- **Medium**: Compression équilibrée (recommandé)
- **High**: Compression maximale (taille minimale)

### Modes de Compression

- **Individual**: Chaque fichier est compressé séparément
- **ZIP**: Tous les fichiers sont compressés dans une archive ZIP

### Types de Fichiers Supportés

| Type | Extensions | Compression |
|------|-----------|-------------|
| Images | jpg, png, gif, webp | ✅ browser-image-compression |
| PDF | pdf | ✅ pdf-lib |
| Vidéos | mp4, avi, mov, webm | ✅ @ffmpeg/ffmpeg |
| Audio | mp3, wav, ogg | ✅ lamejs, @ffmpeg/ffmpeg |
| Archives | zip, rar, 7z | ✅ jszip, pako, fflate |
| Autres | doc, xls, txt, etc. | ✅ fflate (generic) |

##  Design et UX

### Animations et Effets

-  Cartes avec effet hover et élévation
-  Progress bars avec gradient animé
-  Boutons avec transitions fluides
-  Chips de sélection avec animations
-  Empty states avec icônes animées
-  Skeleton loaders pour le chargement

### Palette de Couleurs

- **Primary**: Bleu (#2196F3)
- **Secondary**: Violet (#667eea, #764ba2)
- **Success**: Vert (#43e97b)
- **Error**: Rouge (#f5576c)
- **Warning**: Orange (#fee140)

##  Sécurité

- ✅ Validation des types de fichiers
- ✅ Limite de taille: 200MB par fichier, max 10 fichiers
- ✅ Vérification de l'intégrité des fichiers ZIP
- ✅ Nettoyage automatique des fichiers en cas d'erreur
- ✅ Authentification requise pour toutes les opérations

##  Performance

### Optimisations

- Compression asynchrone avec progress tracking
- Timeout de 30 secondes pour éviter les blocages
- Fallback automatique en cas d'échec de compression
- Streaming pour le téléchargement de gros fichiers
- Validation côté client avant upload

### Limites

- Taille maximale par fichier: **200MB**
- Nombre maximum de fichiers: **10 par upload**
- Timeout de compression: **30 secondes**

##  Gestion des Erreurs

Le système gère automatiquement:
- ❌ Échec de compression → Utilise les fichiers originaux
- ❌ Timeout → Annule l'opération avec message d'erreur
- ❌ Fichier corrompu → Validation avant téléchargement
- ❌ Erreur serveur → Message d'erreur clair à l'utilisateur
- ❌ Fichier manquant → Nettoyage automatique de la base de données

##  Tests

Pour tester le système:

1. **Backend**: Démarrer le serveur
   ```bash
   cd backend
   npm start
   ```

2. **Frontend**: Démarrer l'application
   ```bash
   cd frontend
   npm start
   ```

3. **Tester les scénarios**:
   - Admin upload avec compression
   - Teacher upload de fichiers supplémentaires
   - Student download de fichiers
   - Suppression de fichiers
   - Gestion des erreurs

##  Notes Importantes

- Les fichiers sont stockés dans `backend/uploads/subjects/`
- Les métadonnées sont dans MongoDB (collection `subjects`)
- La compression est optionnelle (niveau "none" disponible)
- Le système fonctionne avec tous types de fichiers
- Les fichiers compressés conservent leur nom original

##  Améliorations Futures

- [ ] Prévisualisation des fichiers (images, PDF)
- [ ] Partage de fichiers entre classes
- [ ] Versioning des fichiers
- [ ] Statistiques d'utilisation
- [ ] Notifications de nouveaux fichiers
- [ ] Recherche et filtrage avancés
- [ ] Drag & drop pour l'upload
- [ ] Upload par lots avec queue

##  Contributeurs

Développé pour le School Management System avec focus sur:
- Performance et efficacité
- UX moderne et intuitive
- Sécurité et fiabilité
- Extensibilité et maintenabilité

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-11-03

