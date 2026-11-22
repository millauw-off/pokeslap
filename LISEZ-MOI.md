# PokéSlap Launcher — mise en place (une seule fois)

## 1. Créer le dépôt GitHub
1. Sur github.com : **New repository**, nom `pokeslap`, **Public**, coche « Add a README » (ou non), crée-le.
2. Installe **GitHub Desktop** (desktop.github.com), connecte ton compte, puis *File → Clone repository → pokeslap*.
3. Copie **tout le contenu** de ce dossier (y compris le dossier caché `.github`) dans le dossier cloné.
4. Ouvre `launcher.config.json` et remplace `REMPLACE-PAR-TON-PSEUDO-GITHUB` par ton pseudo GitHub (le lien doit être `https://raw.githubusercontent.com/TON-PSEUDO/pokeslap/main/manifest.json`).
5. Dans GitHub Desktop : **Commit to main**, puis **Push origin**.

## 2. Mettre les mods des joueurs
Mets dans `files/mods/` les mods que **le joueur doit avoir** (Fabric API, Fabric Language Kotlin, Cobblemon, Cobblemon Trainer Battle, Easy NPC… tout ce qui est requis côté client).
**Pas** CobbleRPG : c'est un mod serveur uniquement. Pas non plus les mods serveur seuls (LuckPerms, etc.).
Tu peux aussi ajouter des fichiers dans `files/resourcepacks/`, `files/config/`, `files/shaderpacks/`…
Chaque fichier doit faire **moins de 100 Mo** (limite GitHub).
Commit + Push : une action GitHub met `manifest.json` à jour toute seule (onglet *Actions* du dépôt, ça prend ~1 minute).

## 3. Construire l'installateur
1. Sur GitHub : onglet **Actions → Construire le launcher → Run workflow**.
2. Attends ~3 à 5 minutes. Ouvre l'exécution terminée, section **Artifacts** : télécharge `PokeSlap-installateur` (contient le `.exe`).
3. Donne cet installateur à tes joueurs (Discord…). Pour une version publique stable, crée un tag `v1.0.0` : l'installateur est alors aussi attaché à une *Release*.

## 4. Mettre à jour les mods plus tard
Remplace/ajoute les fichiers dans `files/`, Commit + Push. Au prochain clic sur **JOUER**, chaque joueur reçoit les changements automatiquement. Les `.jar` de `mods/` qui ne sont plus dans la liste sont supprimés chez le joueur.

## Remarques
- Les joueurs avec **pseudo simple** (TLauncher) utilisent l'onglet « Pseudo simple » ; les autres l'onglet « Compte Microsoft ».
- Windows peut afficher « application non reconnue » : c'est normal sans certificat payant (*Informations complémentaires → Exécuter quand même*).
- Le jeu est installé dans `%appdata%\.pokeslap` (bouton « Ouvrir le dossier du jeu »). Java 21 est téléchargé automatiquement la première fois.
