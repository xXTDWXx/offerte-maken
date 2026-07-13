(function () {
  const STORAGE_KEY = "sunspa-language";
  const SUPPORTED_LANGUAGES = new Set(["nl", "fr"]);

  const exactFr = new Map(Object.entries({
    "Sunspa Catalogus": "Catalogue Sunspa",
    "Sunspa Categorie": "Catégorie Sunspa",
    "Product | Sunspa Catalogus": "Produit | Catalogue Sunspa",
    "Kassa kleine producten": "Caisse petits produits",
    "Sunspa actie banner": "Bannière promotionnelle Sunspa",
    "Elektrische aansluiting | Sunspa Catalogus": "Raccordement électrique | Catalogue Sunspa",
    "Keuzehulp | Sunspa Catalogus": "Aide au choix | Catalogue Sunspa",
    "Stel je hottub samen": "Configurez votre bain nordique",

    "KASSA": "CAISSE",
    "Kassa": "Caisse",
    "SPA": "SPA",
    "Spa": "Spa",
    "ZWEMSPA": "SPA DE NAGE",
    "Zwemspa": "Spa de nage",
    "BARRELSAUNA": "SAUNA BARIL",
    "Barrelsauna": "Sauna baril",
    "INFRAROOD": "INFRAROUGE",
    "Infrarood": "Infrarouge",
    "COMBI SAUNA": "SAUNA COMBI",
    "Combi sauna": "Sauna combi",
    "FINSE SAUNA": "SAUNA FINLANDAIS",
    "Finse sauna": "Sauna finlandais",
    "SAUNA POD": "SAUNA POD",
    "Sauna pod": "Sauna pod",
    "HOTTUB": "BAIN NORDIQUE",
    "Hottub": "Bain nordique",
    "OVERKAPPINGEN": "PERGOLAS",
    "Overkappingen": "Pergolas",
    "KEUZEHULP": "AIDE AU CHOIX",
    "Keuzehulp": "Aide au choix",
    "IN DE SHOWROOM": "EN SHOWROOM",
    "In de showroom": "En showroom",
    "STROOMVEREISTEN": "EXIGENCES ÉLECTRIQUES",
    "ONZE ACTIES": "NOS PROMOTIONS",
    "Onze acties": "Nos promotions",
    "Taal kiezen": "Choisir la langue",
    "Menu": "Menu",
    "Snelle acties": "Actions rapides",
    "Categorieen": "Catégories",
    "Categorieën": "Catégories",
    "Extra": "Extra",

    "Bekijk details": "Voir les détails",
    "👉 Bekijk details": "👉 Voir les détails",
    "Bekijk product": "Voir le produit",
    "Bekijk op website": "Voir sur le site",
    "Voorbeeld offerte": "Aperçu de l'offre",
    "Print offerte": "Imprimer l'offre",
    "Bon printen": "Imprimer le ticket",
    "Technische gegevens": "Données techniques",
    "Print dit schema": "Imprimer ce schéma",
    "Opnieuw beginnen": "Recommencer",
    "Reset": "Réinitialiser",
    "Terug naar overzicht": "Retour à l'aperçu",
    "← Terug naar overzicht": "← Retour à l'aperçu",
    "Vorige": "Précédent",
    "Verder": "Continuer",
    "Vorige stap": "Étape précédente",
    "Samenvatting bekijken": "Voir le récapitulatif",

    "Fout": "Erreur",
    "Fout bij laden": "Erreur lors du chargement",
    "Geen producten gevonden": "Aucun produit trouvé",
    "Pas je filters of zoekterm aan.": "Modifiez vos filtres ou votre recherche.",
    "Controleer of products.json bestaat en bereikbaar is.": "Vérifiez que products.json existe et est accessible.",
    "Controleer of": "Vérifiez que",
    "bestaat en bereikbaar is.": "existe et est accessible.",
    "Geen specificaties beschikbaar.": "Aucune spécification disponible.",
    "Geen product-id in de URL.": "Aucun identifiant de produit dans l'URL.",
    "Product niet gevonden.": "Produit introuvable.",
    "Er staan nog geen producten in de bon.": "Aucun produit n'a encore été ajouté au ticket.",
    "Popup geblokkeerd door de browser.": "Fenêtre pop-up bloquée par le navigateur.",
    "Pop-up geblokkeerd. Sta pop-ups toe om de technische gegevens te printen.": "Fenêtre pop-up bloquée. Autorisez les pop-ups pour imprimer les données techniques.",
    "Pop-up geblokkeerd. Sta pop-ups toe om dit schema te printen.": "Fenêtre pop-up bloquée. Autorisez les pop-ups pour imprimer ce schéma.",

    "Categorie": "Catégorie",
    "Zoeken": "Rechercher",
    "Zoek product...": "Rechercher un produit...",
    "Product zoeken": "Rechercher un produit",
    "Reeks": "Gamme",
    "Alle reeksen": "Toutes les gammes",
    "Sorteren": "Trier",
    "Relevantie": "Pertinence",
    "Prijs (laag → hoog)": "Prix (croissant)",
    "Prijs (hoog → laag)": "Prix (décroissant)",
    "Titel (A → Z)": "Titre (A → Z)",
    "Wissen": "Effacer",
    "Alle types": "Tous les types",
    "Alle merken": "Toutes les marques",
    "Alle aantallen personen": "Tous les nombres de personnes",
    "Type": "Type",
    "Merk": "Marque",
    "Personen": "Personnes",
    "Zoek": "Recherche",
    "Sortering": "Tri",
    "Prijs laag → hoog": "Prix croissant",
    "Prijs hoog → laag": "Prix décroissant",
    "Titel A → Z": "Titre A → Z",

    "Prijs": "Prix",
    "Product": "Produit",
    "Opties": "Options",
    "Totaal": "Total",
    "Totaal:": "Total :",
    "Totaalprijs": "Prix total",
    "Alle bedragen incl. btw & excl. kraankosten.": "Tous les montants s'entendent TVA comprise et hors frais de grue.",
    "Specificaties": "Spécifications",
    "Binnenkleur": "Couleur intérieure",
    "Omkastingkleur": "Couleur de l'habillage",
    "Afmeting": "Dimensions",
    "Afmetingen": "Dimensions",
    "Levering & installatie": "Livraison et installation",
    "Cover & trap inclusief": "Couverture et escalier inclus",
    "Onderhoudspakket": "Kit d'entretien",
    "Filterset (zwemspa)": "Kit de filtres (spa de nage)",
    "Warmtepomp incl. afstelling*": "Pompe à chaleur avec réglage inclus*",
    "Houtkachel + rookafvoer": "Poêle à bois + conduit de fumée",
    "Elektrische kachel": "Poêle électrique",
    "Shingles dak": "Toiture en shingles",
    "Heidedak": "Toiture en bruyère",
    "Design dak": "Toiture design",
    "Infrarood module": "Module infrarouge",
    "-10% actie": "Action -10 %",
    "-10% op de Vogue spa": "-10 % sur le spa Vogue",
    "-10% op Myspa": "-10 % sur Myspa",

    "Datum": "Date",
    "Geldig tot": "Valable jusqu'au",
    "Offerte": "Offre",
    "Offerte laden...": "Chargement de l'offre...",
    "Offerte wordt voorbereid...": "Préparation de l'offre...",
    "Kassabon": "Ticket de caisse",
    "Overzicht van de producten.": "Aperçu des produits.",
    "Particuliere verkoop": "Vente aux particuliers",
    "Totaal kassabedrag": "Montant total du ticket",
    "Geselecteerd product": "Produit sélectionné",
    "Totaal offertebedrag": "Montant total de l'offre",
    "Klantgegevens": "Coordonnées du client",
    "Naam": "Nom",
    "Telefoon": "Téléphone",
    "Telefoon 2": "Téléphone 2",
    "Adres": "Adresse",
    "Plaats": "Localité",
    "Email": "E-mail",
    "Omschrijving": "Description",
    "Subtotaal": "Sous-total",
    "Subtotaal excl. btw": "Sous-total hors TVA",
    "21% BTW": "TVA 21 %",
    "21% btw": "TVA 21 %",
    "Voorschot": "Acompte",
    "Leveringstermijn": "Délai de livraison",
    "Naam koper": "Nom de l'acheteur",
    "Handtekening koper": "Signature de l'acheteur",
    "Naam verkoper": "Nom du vendeur",
    "Handtekening verkoper": "Signature du vendeur",
    "Opmerkingen": "Remarques",
    "Met vriendelijke groeten,": "Cordialement,",
    "BETAALD MET": "PAYÉ AVEC",

    "Actie": "Promotion",
    "10% KORTING OP ALLE VOGUE & MYSPA MODELLEN": "10 % DE RÉDUCTION SUR TOUS LES MODÈLES VOGUE ET MYSPA",
    "Profiteer tijdelijk van extra voordeel op onze Vogue en MySpa modellen.": "Profitez temporairement d'un avantage supplémentaire sur nos modèles Vogue et MySpa.",
    "Tijdelijk voordeel": "Avantage temporaire",
    "Bekijk onze spa's": "Voir nos spas",
    "Extra voordeel": "Avantage supplémentaire",
    "Maak van uw tuin een complete wellnessplek": "Transformez votre jardin en véritable espace bien-être",
    "Kies uw ideale spa en geniet thuis van een luxueuze wellnessbeleving.": "Choisissez le spa idéal et profitez chez vous d'une expérience bien-être luxueuse.",
    "€ 1.000 KORTING OP MYSPA": "1 000 € DE REMISE SUR MYSPA",
    "Op alle MySpa spa's wordt tijdelijk € 1.000,00 korting op de originele prijs verrekend.": "Sur tous les spas MySpa, une remise temporaire de 1 000,00 € est déduite du prix d'origine.",
    "MySpa 1000 euro korting actie": "Promotion MySpa remise de 1 000 euros",
    "Alle MySpa spa's": "Tous les spas MySpa",
    "Korting direct verrekend": "Remise déduite directement",
    "Tijdelijke actie": "Promotion temporaire",
    "Bekijk onze Myspa modellen": "Voir nos modèles MySpa",
    "MySpa actie": "Promotion MySpa",
    "€ 1.000 korting op de originele prijs": "1 000 € de remise sur le prix d'origine",
    "De korting wordt direct in de getoonde actieprijs verwerkt.": "La remise est directement intégrée dans le prix promotionnel affiché.",

    "SELECTEER SHOWROOM": "SÉLECTIONNEZ LE SHOWROOM",
    "Selecteer showroom": "Sélectionner un showroom",
    "Gebruik voorraad van showroom Gent": "Utiliser le stock du showroom de Gand",
    "Gebruik voorraad van showroom Brugge": "Utiliser le stock du showroom de Bruges",
    "Kassa kleine producten": "Caisse petits produits",
    "Andere showroom": "Autre showroom",
    "Voorraad laden...": "Chargement du stock...",
    "Voorraad vernieuwen": "Actualiser le stock",
    "Voorraadbeheer": "Gestion du stock",
    "Gebruiker": "Utilisateur",
    "Wachtwoord": "Mot de passe",
    "Aanmelden": "Se connecter",
    "Aanmelden vereist.": "Connexion requise.",
    "Showroom": "Showroom",
    "Vernieuwen": "Actualiser",
    "Alles opslaan": "Tout enregistrer",
    "Afmelden": "Se déconnecter",
    "Bon maken en voorraad aftrekken...": "Création du ticket et déduction du stock...",
    "Bon gemaakt.": "Ticket créé.",
    "Producten en voorraad laden...": "Chargement des produits et du stock...",
    "Er ging iets mis bij het laden.": "Une erreur est survenue lors du chargement.",
    "kleineproducten.json kon niet geladen worden": "kleineproducten.json n'a pas pu être chargé",
    "voorbeeld-stock.json kon niet geladen worden": "voorbeeld-stock.json n'a pas pu être chargé",
    "Voorraad kon niet geladen worden.": "Le stock n'a pas pu être chargé.",
    "Voorraad kon niet bijgewerkt worden.": "Le stock n'a pas pu être mis à jour.",
    "Voorraad kon niet opgeslagen worden.": "Le stock n'a pas pu être enregistré.",
    "Supabase is niet beschikbaar voor voorraadbeheer.": "Supabase n'est pas disponible pour la gestion du stock.",
    "Aanmelden...": "Connexion...",
    "Aanmelden mislukt.": "Échec de la connexion.",
    "Huidige voorraad": "Stock actuel",
    "Huidige voorraad:": "Stock actuel :",
    "Voorraad": "Stock",
    "is bijgewerkt.": "a été mis à jour.",

    "Technische info": "Informations techniques",
    "Elektrische aansluiting spa’s en zwemspa’s": "Raccordement électrique des spas et spas de nage",
    "Sunspa Spa’s": "Spas Sunspa",
    "Sunspa Zwemspa’s": "Spas de nage Sunspa",
    "MySpa Spa’s": "Spas MySpa",
    "Vogue Spa's": "Spas Vogue",
    "Overige Spa's": "Autres spas",
    "Alle modellen": "Tous les modèles",
    "Voor het spa gedeelte:": "Pour la partie spa :",
    "Voor het zwemgedeelte:": "Pour la partie nage :",
    "OF": "OU",

    "Stap 1": "Étape 1",
    "Stap 2": "Étape 2",
    "Stap 3": "Étape 3",
    "Stap 4": "Étape 4",
    "Wat zoekt u?": "Que recherchez-vous ?",
    "Kies eerst het producttype waarin u wilt zoeken.": "Choisissez d'abord le type de produit que vous souhaitez rechercher.",
    "Welke afmeting wenst u?": "Quelles dimensions souhaitez-vous ?",
    "Kies de afmetingscategorie die het best bij uw ruimte past.": "Choisissez la catégorie de dimensions qui convient le mieux à votre espace.",
    "Laatste voorkeur": "Dernière préférence",
    "Kies een extra voorkeur om uw selectie verder te verfijnen.": "Choisissez une préférence supplémentaire pour affiner votre sélection.",
    "Uw resultaten": "Vos résultats",
    "Hier verschijnen de modellen die passen bij uw keuze.": "Les modèles correspondant à votre choix s'afficheront ici.",
    "Geen exacte match gevonden": "Aucune correspondance exacte trouvée",
    "Pas één van uw keuzes aan of ga een stap terug.": "Modifiez l'un de vos choix ou revenez à l'étape précédente.",
    "Een jacuzzi": "Un jacuzzi",
    "Massage, wellness en comfort voor thuis.": "Massage, bien-être et confort à domicile.",
    "Barrel sauna": "Sauna baril",
    "Compacte buitensauna met warme natuurlijke uitstraling.": "Sauna extérieur compact à l'aspect naturel et chaleureux.",
    "Infrarood sauna": "Sauna infrarouge",
    "Snelle opwarming en ontspanning binnenshuis.": "Montée en température rapide et détente à l'intérieur.",
    "Zwemspa": "Spa de nage",
    "Zwemmen, trainen en ontspannen in één product.": "Nager, s'entraîner et se détendre dans un seul produit.",
    "Geen voorkeur": "Aucune préférence",
    "Geen extra voorkeur": "Aucune préférence supplémentaire",
    "Toon alle passende jacuzzi’s.": "Afficher tous les jacuzzis adaptés.",
    "Toon alle passende barrel sauna’s.": "Afficher tous les saunas barils adaptés.",
    "Toon alle passende zwemspa’s.": "Afficher tous les spas de nage adaptés.",
    "1 ligplaats": "1 place allongée",
    "2 ligplaatsen": "2 places allongées",
    "Met één ligplaats.": "Avec une place allongée.",
    "Met twee ligplaatsen.": "Avec deux places allongées.",
    "Dichte achterzijde": "Arrière fermé",
    "Volledig gesloten achterzijde.": "Arrière entièrement fermé.",
    "Halfglas achterzijde": "Arrière semi-vitré",
    "Model met halfglas achteraan.": "Modèle avec vitrage partiel à l'arrière.",
    "Enkel ontspanning": "Détente uniquement",
    "Voor rust, warmte en algemeen welzijn.": "Pour le repos, la chaleur et le bien-être général.",
    "Spiertherapie": "Thérapie musculaire",
    "Gericht op herstel en verlichting van spierklachten.": "Axé sur la récupération et le soulagement des douleurs musculaires.",
    "Kies of u één of twee ligplaatsen wenst.": "Choisissez si vous souhaitez une ou deux places allongées.",
    "Kies of u een dichte achterzijde of halfglas achteraan wenst.": "Choisissez un arrière fermé ou semi-vitré.",
    "Wat is voor u het belangrijkste gebruik?": "Quelle est votre utilisation principale ?",
    "Geen extra voorkeur nodig. Laat dit op geen voorkeur staan of kies verder.": "Aucune préférence supplémentaire n'est nécessaire. Laissez ce choix sur aucune préférence ou continuez.",
    "Geen exacte match gevonden voor uw selectie.": "Aucune correspondance exacte trouvée pour votre sélection.",

    "Kies stap voor stap het model, de afwerking, het formaat en alle gewenste opties. Na de laatste keuze krijg je een volledige samenvatting met totaalprijs.": "Choisissez étape par étape le modèle, la finition, le format et toutes les options souhaitées. Après le dernier choix, vous obtenez un récapitulatif complet avec le prix total.",
    "200 of 220 cm diameter": "200 ou 220 cm de diamètre",
    "1. Kies je model": "1. Choisissez votre modèle",
    "2. Kies je houtsoort": "2. Choisissez l'essence de bois",
    "3. Kies je diameter / formaat": "3. Choisissez le diamètre / format",
    "4. Kies je kuipkleur": "4. Choisissez la couleur de la cuve",
    "5. Kies je kachel": "5. Choisissez le poêle",
    "6. Kies je massage": "6. Choisissez le massage",
    "7. Kies je verlichting": "7. Choisissez l'éclairage",
    "8. Kies je filter": "8. Choisissez le filtre",
    "9. Kies je cover": "9. Choisissez le couvercle",
    "10. Kies je extra accessoires": "10. Choisissez les accessoires supplémentaires",
    "Start met de vorm van je hottub.": "Commencez par la forme de votre bain nordique.",
    "De prijs wordt later exact bepaald op basis van model en gekozen formaat.": "Le prix exact est ensuite déterminé selon le modèle et le format choisis.",
    "De beschikbare afmetingen hangen af van het gekozen model.": "Les dimensions disponibles dépendent du modèle choisi.",
    "Geen prijsverschil tussen deze kleuren.": "Ces couleurs sont proposées sans supplément.",
    "Extern, intern, elektrisch of hybride volgens de Sunspa configurator.": "Externe, interne, électrique ou hybride selon le configurateur Sunspa.",
    "Kies het gewenste jetsysteem.": "Choisissez le système de jets souhaité.",
    "Sfeerverlichting in de hottub. Meerdere keuzes mogelijk.": "Éclairage d'ambiance dans le bain nordique. Plusieurs choix possibles.",
    "Voor helderder en proper water.": "Pour une eau plus claire et plus propre.",
    "Kies de gewenste afdekking.": "Choisissez la couverture souhaitée.",
    "Werk je hottub verder af met extra opties.": "Complétez votre bain nordique avec des options supplémentaires.",
    "Onze hottubs worden standaard geleverd met 2 m RVS rookkanaal, trapje, minibar, thermometer en waterafvoer.": "Nos bains nordiques sont livrés de série avec 2 m de conduit de fumée en inox, un escalier, un minibar, un thermomètre et une évacuation d'eau.",
    "Je samenstelling": "Votre configuration",
    "Controleer hieronder alle gekozen opties.": "Vérifiez ci-dessous toutes les options sélectionnées.",
    "Rond model": "Modèle rond",
    "Ovaal model": "Modèle ovale",
    "Vierkant model": "Modèle carré",
    "Afwerking / houtsoort": "Finition / essence de bois",
    "Houtsoort": "Essence de bois",
    "Formaat": "Format",
    "Kuipkleur": "Couleur de la cuve",
    "Kachel": "Poêle",
    "Massage": "Massage",
    "Verlichting": "Éclairage",
    "Cover": "Couverture",
    "Extra's": "Extras",
    "Geen": "Aucun",
    "Geen massage": "Sans massage",
    "Geen filter": "Sans filtre",
    "Geen cover": "Sans couverture",
    "Zonder jets": "Sans jets",
    "Zonder filtersysteem": "Sans système de filtration",
    "Zonder extra cover": "Sans couverture supplémentaire",
    "Standaard": "Standard",
    "Combinatie": "Combinaison",
    "Houtkachel extern": "Poêle à bois externe",
    "Houtkachel intern": "Poêle à bois interne",
    "Elektrische Gecko": "Gecko électrique",
    "Hybride systeem": "Système hybride",
    "Extra ruimte in hottub · 304 standaard RVS kachel": "Espace supplémentaire dans le bain nordique · poêle inox 304 standard",
    "Verhoogde zitplek · geïntegreerde houtkachel": "Assise surélevée · poêle à bois intégré",
    "Volledig elektrisch": "Entièrement électrique",
    "Houtkachel + elektrische Gecko": "Poêle à bois + Gecko électrique",
    "Luchtmassage": "Massage à air",
    "Watermassage": "Massage à eau",
    "Extra uitgebreide watermassage": "Massage à eau extra complet",
    "Combinatie van lucht en water": "Combinaison d'air et d'eau",
    "Fijne sfeerverlichting": "Éclairage d'ambiance subtil",
    "Zandfilter": "Filtre à sable",
    "Zandfilter + UV-filter": "Filtre à sable + filtre UV",
    "Extra filtering van het water": "Filtration supplémentaire de l'eau",
    "Extra waterbehandeling": "Traitement supplémentaire de l'eau",
    "Thermo Cover": "Couverture thermique",
    "Houten Cover": "Couverture en bois",
    "Isolerende cover": "Couverture isolante",
    "Massieve houten afdekking": "Couverture massive en bois",
    "Filterbox": "Boîtier de filtration",
    "Strakke afwerking": "Finition soignée",
    "Beitsen": "Lasurer",
    "Beschermende afwerking van het hout": "Finition protectrice du bois",
    "RVS banden": "Cerclages en inox",
    "Strakke metalen afwerking": "Finition métallique soignée",
    "Kachelbescherming": "Protection du poêle",
    "+1 m rookkanaal": "+1 m de conduit de fumée",
    "Extra lengte": "Longueur supplémentaire",
    "Handige lift voor de cover": "Lève-couverture pratique",
    "Gecko Wifi systeem": "Système Gecko Wi-Fi",
    "Bediening via smartphone": "Commande via smartphone",
    "Technische gegevens hottubs": "Données techniques des bains nordiques",
    "Prijzen zijn exclusief kraankosten tenzij anders vermeld. Levering & plaatsing volgens afgesproken voorwaarden (voldoende doorgang, geen obstakels & hulp) Betalingsvoorwaarden: 10% voorschot bij bestelling, restbedrag uiterlijk één week vóór levering.": "Les prix s'entendent hors frais de grue, sauf mention contraire. Livraison et installation selon les conditions convenues (passage suffisant, absence d'obstacles et aide sur place). Conditions de paiement : acompte de 10 % à la commande, solde au plus tard une semaine avant la livraison.",
    "Sunspa Benelux verleent een garantie van 5 jaar op de kuip, 2 jaar op de technische en elektronische onderdelen en 1 jaar op de UV vanaf de datum van levering.": "Sunspa Benelux accorde une garantie de 5 ans sur la cuve, 2 ans sur les pièces techniques et électroniques et 1 an sur l'UV à compter de la date de livraison.",
    "Sunspa Benelux verleent een garantie van 20 jaar op de full spectrum stralers en 2 jaar op de technische en elektronische onderdelen vanaf de dag van levering. Stralers dienen altijd door de klant zelf vervangen te worden, ook tijdens de garantieperiode.": "Sunspa Benelux accorde une garantie de 20 ans sur les émetteurs full spectrum et de 2 ans sur les pièces techniques et électroniques à compter du jour de la livraison. Les émetteurs doivent toujours être remplacés par le client lui-même, y compris pendant la période de garantie.",
    "Sunspa Benelux verleent een garantie van 2 jaar op de technische en elektronische onderdelen vanaf de datum van levering. Door logistieke reden kan het inpakmateriaal niet terug meegenomen worden.": "Sunspa Benelux accorde une garantie de 2 ans sur les pièces techniques et électroniques à compter de la date de livraison. Pour des raisons logistiques, les matériaux d'emballage ne peuvent pas être repris.",

    "Aansluiting": "Raccordement",
    "Aantal banken": "Nombre de bancs",
    "Aantal bekerhouders": "Nombre de porte-gobelets",
    "Aantal jets": "Nombre de jets",
    "Aantal kussens": "Nombre de coussins",
    "Aantal luchtregelaars": "Nombre de régulateurs d'air",
    "Aantal personen": "Nombre de personnes",
    "Aantal ramen": "Nombre de fenêtres",
    "Aantal speakers": "Nombre de haut-parleurs",
    "Aantal waterregelaars": "Nombre de régulateurs d'eau",
    "Accessoires": "Accessoires",
    "Achterzijde Barrel": "Arrière du sauna baril",
    "Afmeting zitplekken": "Dimensions des assises",
    "Afmetingen poot": "Dimensions des pieds",
    "Bereik": "Portée",
    "Besturingssysteem": "Système de commande",
    "Binnen afwerking": "Finition intérieure",
    "Binnen/buiten gebruik": "Usage intérieur/extérieur",
    "Blower": "Blower",
    "Bodem": "Fond",
    "Breedte": "Largeur",
    "Breedte scherm": "Largeur de l'écran",
    "Buiten afwerking": "Finition extérieure",
    "Bullfrog Serie": "Série Bullfrog",
    "Circulatiepomp": "Pompe de circulation",
    "Dakbedekking": "Revêtement de toiture",
    "Deur": "Porte",
    "Doorloophoogte": "Hauteur de passage",
    "Exclusief": "Exclus",
    "Fabrieksgarantie": "Garantie fabricant",
    "Fontein": "Fontaine",
    "Frame": "Châssis",
    "Garantie": "Garantie",
    "Gevuld gewicht": "Poids rempli",
    "Gewicht": "Poids",
    "Glas": "Verre",
    "Heater": "Réchauffeur",
    "Herkomst": "Origine",
    "Hoek verlichting": "Éclairage d'angle",
    "Hoogte": "Hauteur",
    "Inclusief": "Inclus",
    "Inhoud": "Volume",
    "Isolatie": "Isolation",
    "Jet type": "Type de jet",
    "Kantelhoek van de lamellen": "Angle d'inclinaison des lames",
    "Kleur": "Couleur",
    "Kleurcode (RAL)": "Code couleur (RAL)",
    "Led-verlichting": "Éclairage LED",
    "Leeg gewicht": "Poids à vide",
    "Lengte": "Longueur",
    "Lengte banken": "Longueur des bancs",
    "Lengte banken veranda": "Longueur des bancs de véranda",
    "Levering": "Livraison",
    "Levertermijn": "Délai de livraison",
    "Ligplaatsen": "Places allongées",
    "Massage pomp 1": "Pompe de massage 1",
    "Massage pomp 2": "Pompe de massage 2",
    "Massage pomp 3": "Pompe de massage 3",
    "Massage pomp 4": "Pompe de massage 4",
    "Massage pomp 5": "Pompe de massage 5",
    "Massage pomp 6": "Pompe de massage 6",
    "Materiaal": "Matériau",
    "Materiaal dak": "Matériau du toit",
    "Materiaal kuip": "Matériau de la cuve",
    "Materiaal lamellen": "Matériau des lames",
    "Maximale temperatuur": "Température maximale",
    "Met of zonder spa": "Avec ou sans spa",
    "Mini-LED verlichting": "Éclairage mini-LED",
    "muziekinstallatie": "installation audio",
    "Nokhoogte": "Hauteur au faîtage",
    "Oppervlakte": "Surface",
    "Ozonator": "Ozonateur",
    "Pomp 1": "Pompe 1",
    "Pomp 2": "Pompe 2",
    "Pomp 3": "Pompe 3",
    "Premium JetPak® Seats": "Sièges Premium JetPak®",
    "Prijs categorie": "Catégorie de prix",
    "Productcode": "Code produit",
    "Producttype": "Type de produit",
    "Sneeuwbelasting": "Charge de neige",
    "Stralers": "Émetteurs",
    "Stroom": "Alimentation électrique",
    "Subwoofer": "Subwoofer",
    "Therapievormen": "Types de thérapie",
    "Totaal vermogen": "Puissance totale",
    "Trap": "Escalier",
    "Type sauna": "Type de sauna",
    "Type stralers": "Type d'émetteurs",
    "Uitvoering": "Version",
    "Uitvoering (Bullfrog)": "Version (Bullfrog)",
    "Ventilatie": "Ventilation",
    "Vloer": "Sol",
    "Voorportaal": "Sas d'entrée",
    "Vorm": "Forme",
    "Watergordijn": "Rideau d'eau",
    "Waterval": "Cascade",
    "WiFi": "Wi-Fi",
    "Zitplaatsen": "Places assises",

    "Ja": "Oui",
    "Nee": "Non",
    "Hout": "Bois",
    "Belgisch bedrijf": "Entreprise belge",
    "Gratis vanaf €1000": "Gratuit à partir de 1 000 €",
    "Leverbaar tussen 5 à 9 werkdagen": "Disponible sous 5 à 9 jours ouvrables",
    "2 Jaar": "2 ans",
    "Antraciet": "Anthracite",
    "Zandgrijs": "Gris sable",
    "Wit": "Blanc",
    "Zwart": "Noir",
    "Grijs": "Gris"
  }));

  const prefixFr = new Map(Object.entries({
    "Prijs": "Prix",
    "Categorie": "Catégorie",
    "Merk": "Marque",
    "Zoek": "Recherche",
    "Sortering": "Tri",
    "Type": "Type",
    "Personen": "Personnes",
    "Afmeting": "Dimensions",
    "Afwerking": "Finition",
    "Ligplaatsen": "Places allongées",
    "Model": "Modèle",
    "Houtsoort": "Essence de bois",
    "Formaat": "Format",
    "Kuipkleur": "Couleur de la cuve",
    "Kachel": "Poêle",
    "Verlichting": "Éclairage",
    "Filter": "Filtre",
    "Cover": "Couverture",
    "Extra's": "Extras"
  }));

  const replacementsFr = [
    [/\b(\d+)\s+producten\b/gi, "$1 produits"],
    [/\b(\d+)\s+model gevonden\./gi, "$1 modèle trouvé."],
    [/\b(\d+)\s+modellen gevonden\./gi, "$1 modèles trouvés."],
    [/^Stap\s+(\d+)\s+van\s+(\d+)$/i, "Étape $1 sur $2"],
    [/\bVanaf\s+/g, "À partir de "],
    [/\bProducten\b/g, "Produits"],
    [/\bproducten\b/g, "produits"],
    [/\bpersonen\b/g, "personnes"],
    [/\bpersoon\b/g, "personne"],
    [/\bzitplaatsen\b/g, "places assises"],
    [/\bligplaatsen\b/g, "places allongées"],
    [/\bstuks\b/g, "pièces"],
    [/\bliter\b/g, "litres"],
    [/\bjaar\b/g, "an"],
    [/\bJaar\b/g, "An"],
    [/\bRond model\b/g, "Modèle rond"],
    [/Onderhoudspakket/g, "Kit d'entretien"],
    [/\bOvaal model\b/g, "Modèle ovale"],
    [/\bVierkant model\b/g, "Modèle carré"],
    [/\bDichte achterzijde\b/g, "Arrière fermé"],
    [/\bHalfglas\b/g, "Semi-vitré"],
    [/\bDichte\b/g, "Fermé"],
    [/\bGesloten\b/g, "Fermé"],
    [/\bKrachtstroom\b/g, "Courant triphasé"],
    [/\bkrachtstroom\b/g, "courant triphasé"],
    [/\bkarakteristiek\b/g, "courbe"],
    [/\bnul en aarde\b/g, "neutre et terre"],
    [/\b1x fase\b/g, "1x phase"],
    [/\b2x fase\b/g, "2x phase"],
    [/\b3x fase\b/g, "3x phase"],
    [/\bfase\b/g, "phase"],
    [/\bamp\./g, "A"],
    [/(\d+)\s*A C courbe/g, "$1 A courbe C"],
    [/^Voorraad\s+(.+)\s+vernieuwen\.\.\.$/g, "Actualisation du stock de $1..."],
    [/^Live voorraad voor\s+(.+)\s+geladen\.$/g, "Stock en direct de $1 chargé."],
    [/^Voorraad\s+(.+)\s+laden\.\.\.$/g, "Chargement du stock de $1..."],
    [/^Voorraad\s+(.+)\s+geladen\.$/g, "Stock de $1 chargé."],
    [/^Voorraad\s+(.+)\s+opslaan\.\.\.$/g, "Enregistrement du stock de $1..."],
    [/^Alle voorraad is opgeslagen voor\s+(.+)\.$/g, "Tout le stock est enregistré pour $1."],
    [/^Bon gemaakt\. Voorraad\s+(.+)\s+is bijgewerkt\.$/g, "Ticket créé. Le stock de $1 a été mis à jour."],
    [/^Huidige voorraad:\s*/g, "Stock actuel : "],
    [/\bVoor het spa gedeelte:/g, "Pour la partie spa :"],
    [/\bVoor het zwemgedeelte:/g, "Pour la partie nage :"],
    [/\bAlle modellen\b/g, "Tous les modèles"],
    [/\bPromotie spa's\b/g, "Spas promotionnels"],
    [/\bDELight spa's\b/g, "spas DELight"],
    [/Bedankt voor uw interesse\. Hieronder vindt u een overzicht van de geselecteerde configuratie en bijhorende opties\./g, "Merci pour votre intérêt. Vous trouverez ci-dessous un aperçu de la configuration sélectionnée et des options correspondantes."]
  ];

  function getLanguageFromUrl() {
    try {
      const value = new URLSearchParams(window.location.search).get("lang");
      return SUPPORTED_LANGUAGES.has(value) ? value : "";
    } catch {
      return "";
    }
  }

  function getStoredLanguage() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return SUPPORTED_LANGUAGES.has(value) ? value : "";
    } catch {
      return "";
    }
  }

  const urlLanguage = getLanguageFromUrl();
  const currentLanguage = urlLanguage || getStoredLanguage() || "nl";

  try {
    window.localStorage.setItem(STORAGE_KEY, currentLanguage);
  } catch {
    // Ignore storage errors in private browsing or restricted contexts.
  }

  function isFrench() {
    return currentLanguage === "fr";
  }

  function preserveWhitespace(original, translated) {
    const leading = String(original).match(/^\s*/)?.[0] || "";
    const trailing = String(original).match(/\s*$/)?.[0] || "";
    return leading + translated + trailing;
  }

  function translateText(value) {
    if (!isFrench()) return value;

    const original = String(value ?? "");
    const trimmed = original.trim();
    if (!trimmed) return original;
    const normalizedKey = trimmed.replace(/\s+/g, " ");

    if (exactFr.has(trimmed) || exactFr.has(normalizedKey)) {
      return preserveWhitespace(original, exactFr.get(trimmed) || exactFr.get(normalizedKey));
    }

    const colonMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (colonMatch && prefixFr.has(colonMatch[1].trim())) {
      return preserveWhitespace(original, `${prefixFr.get(colonMatch[1].trim())} : ${colonMatch[2]}`);
    }

    let translated = trimmed;
    for (const [pattern, replacement] of replacementsFr) {
      translated = translated.replace(pattern, replacement);
    }

    return preserveWhitespace(original, translated);
  }

  function translateAttribute(el, attr) {
    if (!el.hasAttribute(attr)) return;
    const current = el.getAttribute(attr);
    const translated = translateText(current);
    if (translated !== current) el.setAttribute(attr, translated);
  }

  function shouldSkipElement(el) {
    if (!el) return false;
    const tag = el.nodeName;
    return tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT";
  }

  function translateDocument(doc = document) {
    if (!isFrench() || !doc?.body) return;

    doc.documentElement.setAttribute("lang", "fr");
    if (doc.title) doc.title = translateText(doc.title);

    const walker = doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
          return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      const translated = translateText(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    });

    doc.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach(el => {
      translateAttribute(el, "placeholder");
      translateAttribute(el, "aria-label");
      translateAttribute(el, "title");
      translateAttribute(el, "alt");
    });
  }

  function localizeUrl(value, language = currentLanguage) {
    if (!value || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:") || value.startsWith("javascript:")) {
      return value;
    }

    try {
      const url = new URL(value, window.location.href);
      if (url.origin !== window.location.origin) return value;
      url.searchParams.set("lang", language);
      return url.pathname.split("/").pop() + url.search + url.hash;
    } catch {
      return value;
    }
  }

  function localizeLinks(doc = document) {
    doc.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href");
      const localized = localizeUrl(href);
      if (localized !== href) link.setAttribute("href", localized);
    });
  }

  function setLanguage(language) {
    if (!SUPPORTED_LANGUAGES.has(language)) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage errors.
    }

    const url = new URL(window.location.href);
    url.searchParams.set("lang", language);
    window.location.href = url.toString();
  }

  function injectSwitcher(doc = document) {
    if (doc.getElementById("sunspaLanguageSwitcher")) return;

    const style = doc.createElement("style");
    style.textContent = `
      .language-switcher{
        position:fixed;
        top:12px;
        right:12px;
        z-index:9999;
        display:inline-flex;
        align-items:center;
        gap:2px;
        padding:3px;
        border:1px solid rgba(15,23,42,.18);
        border-radius:999px;
        background:rgba(255,255,255,.94);
        box-shadow:0 8px 24px rgba(15,23,42,.12);
        backdrop-filter:blur(8px);
      }
      .language-switcher button{
        min-width:38px;
        height:32px;
        border:0;
        border-radius:999px;
        background:transparent;
        color:#0f172a;
        font:700 13px/1 Arial, Helvetica, sans-serif;
        cursor:pointer;
      }
      .language-switcher button.is-active{
        background:#0f172a;
        color:#fff;
      }
      body.showroom-menu-proposal .showroom-logo-row{
        padding-right:112px;
      }
      body.showroom-menu-proposal .showroom-top-kassa{
        flex:0 0 auto;
      }
      @media (max-width:700px){
        .language-switcher{
          top:8px;
          right:8px;
        }
        body.showroom-menu-proposal .showroom-logo-row{
          padding-right:98px;
        }
      }
      @media print{
        .language-switcher{display:none!important;}
      }
    `;
    doc.head.appendChild(style);

    const switcher = doc.createElement("div");
    switcher.className = "language-switcher";
    switcher.id = "sunspaLanguageSwitcher";
    switcher.setAttribute("aria-label", "Taal kiezen");
    switcher.innerHTML = `
      <button type="button" data-language="nl" class="${currentLanguage === "nl" ? "is-active" : ""}">NL</button>
      <button type="button" data-language="fr" class="${currentLanguage === "fr" ? "is-active" : ""}">FR</button>
    `;

    switcher.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", () => setLanguage(button.dataset.language));
    });

    doc.body.appendChild(switcher);
  }

  function observeTranslations() {
    if (!isFrench() || !window.MutationObserver) return;
    let pending = false;
    const observer = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(() => {
        pending = false;
        translateDocument(document);
        localizeLinks(document);
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function translatePrintWindow(win) {
    if (!isFrench() || !win?.document) return;
    translateDocument(win.document);
  }

  window.SunspaI18n = {
    lang: currentLanguage,
    isFrench,
    t: translateText,
    localizeUrl,
    localizeLinks,
    translateDocument,
    translatePrintWindow,
    setLanguage
  };

  document.addEventListener("DOMContentLoaded", () => {
    injectSwitcher(document);
    localizeLinks(document);
    translateDocument(document);
    observeTranslations();
  });
})();
