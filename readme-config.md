# Casino — Frontend réécrit

## Arborescence livrée

```
Casino/
├── types.ts                     # Types alignés sur CASINO_README.md
├── casino.service.ts            # Client HTTP complet (/api/casino/*)
├── CasinoPage.tsx                # Page principale (orchestration)
├── CasinoHeader.tsx              # Inchangé (thème conservé)
├── CasinoTabs.tsx                 # Inchangé (thème conservé)
├── components/
│   ├── common.tsx                # Modal, champs, badges, formatage — thème CSS vars existant
│   ├── PlayerSelector.tsx        # Bloc réutilisable : scan QR OU sélection/ajout simple
│   ├── QrScanModal.tsx           # Scan caméra (BarcodeDetector) + saisie manuelle
│   ├── ClientPickerModal.tsx     # Recherche simple / ajout rapide sans carte
│   ├── CashOperationModal.tsx    # buy-in / deposit / cash-out
│   ├── ChipOperationModal.tsx    # achat / reprise de jetons
│   ├── ChipTypeFormModal.tsx     # CRUD types de jetons
│   ├── RoomCashierModal.tsx      # CRUD salle + caisse
│   ├── SessionModal.tsx          # Ouverture / clôture de session de caisse
│   ├── CreditModal.tsx           # Octroi / avance / remboursement de crédit
│   ├── IncidentModal.tsx         # Déclaration incident/litige
│   ├── ScoringPanel.tsx          # Calcul + facteurs + décision humaine (valider/contester/annuler)
│   ├── ClientProfileModal.tsx    # Fiche joueur complète (profil, historique, F&B, incidents, scoring)
│   └── VisitCheckInModal.tsx     # Check-in en salle (avec ou sans carte)
└── tabs/
    ├── OverviewTab.tsx           # Dashboard + rapports de consolidation
    ├── RoomsTab.tsx              # Salles, caisses, sessions, opérations
    ├── CardsCreditsTab.tsx       # Cartes, jetons, crédits, config scoring
    ├── ClientsTab.tsx            # Recherche / ajout joueurs
    └── CaisseTab.tsx             # Historique sessions, écarts, flux à synchroniser
```

## Hypothèses techniques

- **`Button`** est réimporté depuis `../../UI` comme dans vos fichiers d'origine
  (`CasinoHeader.tsx`). Adaptez le chemin relatif selon l'emplacement final du
  dossier `Casino/`.
- Le thème (`var(--color-surface)`, `var(--color-border)`, `var(--color-accent)`,
  `var(--color-bg)`, classes `text-primary` / `text-muted` / `text-secondary`,
  police `Playfair Display`) est repris tel quel de `CasinoHeader.tsx` /
  `CasinoTabs.tsx` — aucun nouveau token n'a été introduit.
- **`casino.service.ts`** utilise `fetch` natif avec le token lu dans
  `localStorage.getItem('token')` (ou `auth_token`). Adaptez `getToken()` si
  votre app utilise un autre mécanisme (contexte Auth, cookie, etc.).
- **Onglet Stock** : conservé volontairement hors périmètre (déjà implémenté
  côté projet selon vos travaux précédents sur `StockTab.tsx`). `CasinoPage.tsx`
  l'importe depuis `./StockTab` — remplacez ce chemin par l'emplacement réel de
  votre composant existant.
- **Scan QR** : utilise l'API native `BarcodeDetector` quand le navigateur la
  supporte (Chrome/Edge desktop & Android). Bascule automatiquement sur la
  saisie manuelle du code sinon (douchette USB ou saisie clavier) — aucune
  dépendance externe requise.

## Fonctionnalités couvertes (mapping README)

| Fonctionnalité demandée | Implémentation |
|---|---|
| Scan QR carte fidélité | `QrScanModal` + `cardsApi.scan` |
| Sélection/ajout simple sans carte | `ClientPickerModal` + `clientsApi.search` / `quickAdd` |
| Buy-in / encaissement / cash-out | `CashOperationModal` + `operationsApi.*` |
| Avance / crédit joueur | `CreditModal` (`CreditGrantModal`, `CreditDrawModal`, `CreditRepayModal`) |
| Horodatage + caissier + joueur | Géré côté backend (JWT + `created_at`) ; le frontend transmet `client_id`/`client_libre` |
| Salle → plusieurs caisses | `RoomsTab` (colonne salles → caisses filtrées) |
| Session ouverture/fermeture | `SessionModal` (`OpenSessionModal`, `CloseSessionModal`) |
| CRUD jetons avec prix | `ChipTypeFormModal` + `chipTypesApi` |
| Écriture financière liée (`ref_flux_global`) | Généré côté backend ; visible dans `CaisseTab` (flux à synchroniser) |
| Consolidation (produit net, écarts, encours) | `OverviewTab` + `CaisseTab` (`reportsApi.*`) |
| Pas de double saisie / réconciliation batch | `CaisseTab` → section "Flux à synchroniser" |
| Historique visites / salles fréquentées | `ClientProfileModal` (onglet Historique) |
| Antécédents (incidents, litiges, statut) | `ClientProfileModal` (onglets Profil/Incidents) + `IncidentModal` |
| Consommation F&B/bar | `ClientProfileModal` (onglet F&B / Bar) |
| Scoring configurable + décision humaine | `ScoringPanel` + config dans `CardsCreditsTab` |

## Points d'attention métier respectés

- Le calcul de score (`POST /scoring/:clientId/compute`) **ne modifie jamais**
  le statut spécial du client. Toute conséquence (VIP, surveillance, exclusion)
  passe par `ClientStatutForm` dans `ClientProfileModal`, avec **motif
  obligatoire** (décision humaine explicite, jamais automatique).
- Le score affiche systématiquement les facteurs et permet de **valider,
  contester ou annuler** la décision (`ScoringPanel`).
- Les seuils et le plafond de crédit sont édités depuis `CardsCreditsTab`
  (`ScoringConfigCard`), jamais codés en dur côté frontend.