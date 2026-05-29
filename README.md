# Little Mamma Agdal — Site officiel

Site one-page pour la trattoria **Little Mamma** à Agdal, Rabat.
Vanilla HTML / CSS / JS — pas de framework. Commande client → WhatsApp.

## Structure

```
little-mamma-classique/
├── index.html              ── page d'accueil (hero, about, menu, gallery, contact)
├── styles/style.css        ── design warm dark / glassmorphic
├── src/
│   ├── main.js             ── bootstrap, sticky nav, parallax, reveal-on-scroll
│   └── uiManager.js        ── carte dynamique, panier persistant, WhatsApp checkout
└── assets/
    ├── menu.json           ── 53 plats (salades, pizzas, pastas, ravioli, plats, dolci)
    └── images/             ── photos restaurant
```

## Lancer en local

```bash
python -m http.server 8081
```

Puis ouvrir http://localhost:8081

## Fonctionnalités

- Carte chargée dynamiquement depuis `menu.json`
- Onglets par catégorie
- Panier persistant (localStorage)
- Checkout → ouverture WhatsApp avec récapitulatif
- Reset automatique du panier après envoi
- Responsive mobile / tablette / desktop

## Contact restaurant

- Adresse : Avenue Fal Ould Oumeir, Agdal, Rabat
- WhatsApp commandes : +212 708 207 496
