#  Guide de Test - Système de Gestion de Fichiers

## ✅ Statut du Système

- ✅ **Backend**: Démarré sur `http://localhost:5000`
- ✅ **Frontend**: Démarré sur `http://localhost:3000`
- ✅ **MongoDB**: Connecté
- ✅ **Compilation**: Réussie sans erreurs

##  Scénarios de Test

###  Prérequis

Assurez-vous d'avoir:
1. Un compte **Admin** créé
2. Une **classe** créée
3. Un compte **Teacher** assigné à un subject
4. Un compte **Student** inscrit dans une classe

---

##  Test Admin - Création de Subject avec Fichiers

### Étapes:

1. **Se connecter en tant qu'Admin**
   - Aller sur `http://localhost:3000`
   - Se connecter avec les identifiants Admin

2. **Naviguer vers la création de Subject**
   - Cliquer sur **Subjects** dans le menu
   - Cliquer sur **Add Subject**

3. **Remplir le formulaire**
   - Sélectionner une classe
   - Ajouter un subject:
     - Subject Name: "Mathematics"
     - Subject Code: "MATH101"
     - Sessions: "1"

4. **Configurer la compression**
   - Niveau de compression: **Medium** (recommandé)
   - Mode de compression: **Individual** ou **ZIP**

5. **Uploader des fichiers**
   - Cliquer sur l'accordéon du subject
   - Cliquer sur **Choose Files**
   - Sélectionner plusieurs fichiers de types différents:
     - ✅ Une image (JPG, PNG)
     - ✅ Un PDF
     - ✅ Un document Word/Excel
     - ✅ (Optionnel) Une vidéo ou audio

6. **Soumettre**
   - Cliquer sur **Submit**
   - Observer la barre de progression
   - Vérifier le message de succès

### ✅ Résultats Attendus:

- ✅ Barre de progression affichée avec gradient animé
- ✅ Message "Processing files..." visible
- ✅ Compression effectuée (si niveau ≠ none)
- ✅ Message de succès: "X subject(s) created successfully"
- ✅ Redirection vers la liste des subjects

### Vérifications:

- Les fichiers sont visibles dans le subject créé
- Les chips de compression sont affichés
- La taille des fichiers est réduite (si compression activée)

---

##  Test Teacher - Upload de Fichiers Supplémentaires

### Étapes:

1. **Se connecter en tant qu'Teacher**
   - Se déconnecter de l'Admin
   - Se connecter avec les identifiants Teacher

2. **Naviguer vers Subject Files**
   - Cliquer sur **Subject Files** dans le menu latéral
   - Vérifier que le nom du subject est affiché

3. **Voir les fichiers existants**
   - Section "Existing Files" affiche les fichiers uploadés par l'Admin
   - Chaque fichier a un bouton **Download** et **Delete**

4. **Uploader de nouveaux fichiers**
   - Choisir le niveau de compression: **High**
   - Choisir le mode: **ZIP**
   - Cliquer sur **Choose Files**
   - Sélectionner 2-3 nouveaux fichiers

5. **Soumettre l'upload**
   - Cliquer sur **Upload X File(s)**
   - Observer la progression
   - Vérifier le message de succès

### ✅ Résultats Attendus:

- ✅ Interface moderne avec design fluide
- ✅ Fichiers existants visibles
- ✅ Upload réussi avec compression
- ✅ Nouveaux fichiers ajoutés à la liste
- ✅ Animations et transitions fluides

###  Vérifications:

- Les nouveaux fichiers apparaissent dans "Existing Files"
- Le compteur de fichiers est mis à jour
- Les chips de compression affichent "High" et "zip"

---

##  Test Teacher - Téléchargement de Fichiers

### Étapes:

1. **Dans la page Subject Files**
   - Sélectionner un fichier dans la liste

2. **Télécharger le fichier**
   - Cliquer sur **Download**
   - Le fichier se télécharge automatiquement

3. **Vérifier le fichier téléchargé**
   - Ouvrir le fichier téléchargé
   - Vérifier qu'il s'ouvre correctement
   - Vérifier le contenu

### ✅ Résultats Attendus:

- ✅ Téléchargement immédiat
- ✅ Fichier valide et utilisable
- ✅ Nom de fichier correct
- ✅ Pas de corruption

---

##  Test Teacher - Suppression de Fichiers

### Étapes:

1. **Dans la page Subject Files**
   - Sélectionner un fichier à supprimer

2. **Supprimer le fichier**
   - Cliquer sur l'icône **Delete** (poubelle)
   - Confirmer la suppression dans la popup

3. **Vérifier la suppression**(Pas Implementer sur cette version)
   - Le fichier disparaît de la liste
   - Message de succès affiché

###  Résultats Attendus:

- [x] Confirmation demandée avant suppression
- [x] Fichier supprimé de la liste
- [x] Message "File deleted successfully"
- [x] Compteur de fichiers mis à jour

---

## 5️⃣ Test Student - Visualisation et Téléchargement

### Étapes:

1. **Se connecter en tant qu'Student**
   - Se déconnecter du Teacher
   - Se connecter avec les identifiants Student

2. **Naviguer vers les Subjects**
   - Aller sur **Subjects** dans le menu
   - Sélectionner le subject créé précédemment

3. **Voir les fichiers**
   - Section "Fichiers associés" affiche tous les fichiers
   - Informations visibles: nom, taille, type, compression

4. **Télécharger un fichier**
   - Cliquer sur **Télécharger**
   - Le fichier se télécharge

### ✅ Résultats Attendus:

- ✅ Tous les fichiers du subject sont visibles
- ✅ Téléchargement fonctionne correctement
- ✅ Interface claire et intuitive
- ✅ Pas d'option de suppression (Student ne peut pas supprimer)

---

## 6️⃣ Test de Compression - Différents Niveaux

### Étapes:

1. **Préparer 4 fichiers identiques**
   - Dupliquer un fichier image (ex: 5MB)

2. **Tester chaque niveau de compression**
   - **None**: Uploader avec compression "None"
   - **Low**: Uploader avec compression "Low"
   - **Medium**: Uploader avec compression "Medium"
   - **High**: Uploader avec compression "High"

3. **Comparer les tailles**
   - Noter la taille de chaque fichier uploadé
   - Comparer les ratios de compression

### ✅ Résultats Attendus:

| Niveau | Taille Attendue | Qualité |
|--------|----------------|---------|
| None | 5MB (original) | 100% |
| Low | ~4MB | 95% |
| Medium | ~2.5MB | 85% |
| High | ~1MB | 70% |

---

## 7️⃣ Test de Compression - Mode ZIP

### Étapes:

1. **Uploader plusieurs fichiers en mode ZIP**
   - Sélectionner 5 fichiers différents
   - Choisir mode: **ZIP**
   - Choisir niveau: **Medium**

2. **Vérifier le résultat**
   - Un seul fichier ZIP est créé
   - Le nom contient tous les fichiers originaux

3. **Télécharger et extraire**
   - Télécharger le fichier ZIP
   - Extraire le contenu
   - Vérifier que tous les fichiers sont présents

### ✅ Résultats Attendus:

- ✅ Un fichier ZIP unique créé
- ✅ Taille réduite par rapport aux fichiers individuels
- ✅ Tous les fichiers présents après extraction
- ✅ Pas de corruption

---

## 8️⃣ Test de Gestion d'Erreurs

### Test 1: Fichier trop volumineux

1. Essayer d'uploader un fichier > 200MB
2. **Résultat attendu**: Message d'erreur "File too large"

### Test 2: Trop de fichiers

1. Essayer d'uploader > 10 fichiers
2. **Résultat attendu**: Message d'erreur "Too many files"

### Test 3: Timeout de compression

1. Uploader un très gros fichier vidéo (>100MB)
2. Si timeout (30s), **Résultat attendu**: Fallback vers fichier original

### Test 4: Annulation d'opération

1. Commencer un upload
2. Cliquer sur "Cancel Operation"
3. **Résultat attendu**: Upload annulé, message d'erreur

---

## 9️⃣ Test de Performance

### Étapes:

1. **Uploader 10 fichiers simultanément**
   - Mélange d'images, PDF, documents
   - Niveau: Medium
   - Mode: Individual

2. **Observer les performances**
   - Temps de compression
   - Temps d'upload
   - Temps total

### ✅ Résultats Attendus:

- ✅ Compression < 30 secondes
- ✅ Upload fluide sans blocage
- ✅ Barre de progression précise
- ✅ Pas de crash ou freeze

---

##  Test de Design et UX

### Vérifications visuelles:

- ✅ **Animations fluides**: Hover sur cartes, boutons
- ✅ **Progress bar avec gradient**: Bleu animé
- ✅ **Chips colorés**: Compression avec gradient violet
- ✅ **Empty state**: Icône et message quand pas de fichiers
- ✅ **Responsive**: Fonctionne sur mobile/tablette
- ✅ **Transitions**: Smooth entre les états
- ✅ **Icons**: Appropriés pour chaque type de fichier

### Interactions:

- ✅ Boutons réactifs au hover
- ✅ Chips cliquables avec feedback visuel
- ✅ Accordéons s'ouvrent/ferment smoothly
- ✅ Alerts avec animation slide-in
- ✅ Loading states clairs

---

##  Checklist Finale (Version 1.0)

### Backend
- ✅ Routes créées et fonctionnelles
- ✅ Controllers implémentés
- ✅ Upload de fichiers fonctionne
- ✅ Download de fichiers fonctionne
- [x] Suppression de fichiers fonctionne
- [x] Gestion d'erreurs robuste

### Frontend - Admin
- ✅ Page SubjectForm avec upload
- ✅ Compression configurée
- ✅ Progress tracking
- [x] Design moderne appliqué

### Frontend - Teacher
- ✅ Page TeacherSubjectFiles créée
- [x] Navigation ajoutée
- ✅ Upload de fichiers
- ✅ Download de fichiers
- [x] Suppression de fichiers
- [x] Design moderne appliqué

### Frontend - Student
- ✅ Visualisation des fichiers
- ✅ Download de fichiers
- ✅ Interface claire

### Compression
- ✅ Images (browser-image-compression)
- ✅ PDF (pdf-lib)
- ✅ Vidéos (@ffmpeg/ffmpeg)
- ✅ Audio (lamejs)
- ✅ ZIP (jszip, pako, fflate)
- ✅ Autres fichiers (fflate)

### Design
-  Styles modernes créés
- ✅ Animations fluides
- ✅ Gradient progress bars
- [x] Chips colorés
- [x] Empty states
- [x] Responsive design

---

##  Prochaines Étapes

Après avoir testé tous les scénarios:

1. **Vérifier les logs**
   - Backend: Console du serveur
   - Frontend: Console du navigateur (F12)

2. **Tester avec différents navigateurs**
   - Chrome
   - Firefox
   - Edge

3. **Tester sur mobile**
   - Responsive design
   - Touch interactions

4. **Performance en production**
   - Build de production: `npm run build`
   - Tester les performances

---

##  Rapport de Bugs

Si vous trouvez des bugs, notez:
- **Scénario**: Quel test?
- **Étapes**: Comment reproduire?
- **Résultat attendu**: Que devrait-il se passer?
- **Résultat actuel**: Que se passe-t-il?
- **Console**: Messages d'erreur?
- **Navigateur**: Quel navigateur?

---

**Bon test ! **

