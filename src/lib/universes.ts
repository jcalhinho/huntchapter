export type UniverseConfig = {
  id: string;
  label: string;
  description: string;
  genre: string;
  ton: string;
  pov: string;
  words: string[];
};

const FRONTIER_WORDS = [
  'Galaxie', 'Nebuleuse', 'Station', 'Hyperdrive', 'Vaisseau', 'Synthese', 'Module', 'Android', 'Cybernetique', 'Propulseur',
  'Asteroide', 'Quantum', 'Singularite', 'Protocol', 'Colonie', 'Alliance', 'Terraformage', 'Hologramme', 'Cryostase', 'Navigation',
  'Capteur', 'Drone', 'Satellite', 'Orbiteur', 'Flux', 'Ionique', 'Cargo', 'Porteur', 'Champ', 'Gravite',
  'Observatoire', 'Portail', 'Subspatial', 'Calculateur', 'Nanite', 'Sonde', 'Antimatiere', 'Bionique', 'Interface', 'Membrane',
  'Photon', 'Rayonnement', 'Anomalie', 'Artefact', 'Laboratoire', 'Simulation', 'Serveur', 'Moteur', 'Mission', 'Empreinte',
  'Voyageur', 'Archiviste', 'Commandant', 'Assaut', 'Garnison', 'Habitat', 'Dorsale', 'Energie', 'Reacteur', 'Cryopod',
  'Stase', 'Spectre', 'Analyseur', 'Scanner', 'Exoplanete', 'Cosmonaute', 'Cartographie', 'Pylone', 'Janus', 'Chronometrie',
  'Dilatation', 'Relais', 'Spectrometre', 'Astromap', 'Ejecteur', 'Avatar', 'ProtocolZero', 'Citadelle', 'Ruine', 'Sillage',
  'Fret', 'Hangar', 'Magnetique', 'Synapse', 'Superstructure', 'Anneau', 'Traverse', 'Moniteur', 'Pulseur', 'Echo',
  'Sigma', 'Orbite', 'Terraformeuse', 'Halo', 'Cryolab', 'Archivage', 'Convergence', 'Axion', 'Pulsar', 'Xenolith',
];

const ARCANE_WORDS = [
  'Foret', 'Chateau', 'Dragon', 'Magie', 'Tresor', 'Quete', 'Princesse', 'Chevalier', 'Epee', 'Mystere',
  'Nuit', 'Etoiles', 'Lune', 'Ombre', 'Secret', 'Destin', 'Courage', 'Peur', 'Amour', 'Haine',
  'Vengeance', 'Alliance', 'Trahison', 'Prophetie', 'Ancien', 'Artefact', 'Creature', 'Royaume', 'Guerre', 'Paix',
  'Honneur', 'Gloire', 'Ruines', 'Savoir', 'Pouvoir', 'Voyage', 'Temps', 'Portail', 'Ile', 'Desert',
  'Montagne', 'Ocean', 'Riviere', 'Cite', 'Legende', 'Mythe', 'Heros', 'Monstre', 'Dieu', 'Esprit',
  'Rituel', 'Cauchemar', 'Tombeau', 'Reliques', 'Abysses', 'Malediction', 'Sanctuaire', 'Oracle', 'Vision', 'Sepulcre',
  'Corruption', 'Tenebres', 'Lumiere', 'Sang', 'Pacte', 'Enigme', 'Labyrinthe', 'Hurlement', 'Chuchotement', 'Spectre',
  'Necromancien', 'Alchimie', 'Runes', 'Arcanes', 'Inquisiteur', 'Revelation', 'Crepuscule', 'Aube', 'Eclipse', 'Faille',
  'Souterrain', 'Catacombes', 'Fantome', 'Ombres', 'Gardiens', 'Veilleur', 'Effroi', 'Folie', 'Serment', 'Trone',
  'Banniere', 'Conjuration', 'Invocation', 'Dague', 'Poison', 'Clairvoyance', 'Prophete', 'Vestiges', 'Grimoire', 'Obelisque',
];

const METRO_WORDS = [
  'Metro', 'Gratteciel', 'Neon', 'Asphalte', 'Sirene', 'Detective', 'Camera', 'Balcon', 'Fuite', 'Ruelle',
  'Enquete', 'Indice', 'Dossier', 'Fichier', 'Planque', 'Informer', 'Coffre', 'Reseau', 'Cryptage', 'Signalement',
  'Temoin', 'Alibi', 'Ombre', 'Code', 'Verrou', 'Badge', 'Portique', 'Brigade', 'Patrouille', 'Radar',
  'DroneCivil', 'Graffiti', 'Rumeur', 'Informateur', 'Souterrain', 'Tunnel', 'Station', 'Quais', 'Livraison', 'Chantage',
  'Cabriole', 'Course', 'Taxi', 'Quartier', 'Garage', 'Entrepot', 'Eclairage', 'Electricite', 'Nocturne', 'Verite',
  'Mystere', 'Complot', 'Serveur', 'Backdoor', 'Pirate', 'Proxy', 'Darknet', 'Terminal', 'Base', 'ProtocolUrbain',
  'Planification', 'Confinement', 'Crime', 'Scene', 'Preuve', 'Balistique', 'Analyse', 'Laboratoire', 'Technicien', 'Manipulation',
  'Filature', 'Disparition', 'SireneBleue', 'Archive', 'Journal', 'Chronique', 'Reporter', 'Camouflage', 'Carte', 'Capuche',
  'Adversaire', 'Detecteur', 'Scanner', 'BadgeOr', 'Cle', 'Verrous', 'Encodage', 'Antenne', 'Signal', 'Tour',
  'Toit', 'Projecteur', 'Alarme', 'Connexion', 'Cafe', 'Rendezvous', 'Plan', 'Blocus', 'Sas', 'Balustrade',
];

const HERITAGE_WORDS = [
  'Couronne', 'Dynastie', 'Empire', 'Citadelle', 'Donjon', 'Manuscrit', 'Chronique', 'Monarque', 'Province', 'Bataillon',
  'Harnois', 'Arbalete', 'Catapulte', 'Legion', 'Siege', 'Palisade', 'Bastion', 'Rempart', 'Tambour', 'Etendard',
  'Heraldique', 'Traite', 'Parlement', 'Ambassade', 'Messager', 'Caravane', 'Marchand', 'Guilde', 'Epices', 'Carrosse',
  'Hussard', 'Grenadier', 'Escadre', 'Amiral', 'Fregate', 'Voiles', 'Astrolabe', 'Cartographe', 'Comptoir', 'Colonne',
  'Agora', 'Forum', 'Aqueduc', 'Citerne', 'Temple', 'Oracle', 'Phare', 'Bibliotheque', 'Scribe', 'Papyrus',
  'Calame', 'Cire', 'Sceau', 'Chronogramme', 'Edit', 'Senat', 'Consul', 'Tribunal', 'Juriste', 'Artisan',
  'Forge', 'Fonderie', 'Atelier', 'Tisserand', 'Compagnon', 'Corporation', 'Chantier', 'Marbre', 'Mosaique', 'Icone',
  'Reliquaire', 'Abbaye', 'Cloitre', 'Cathedrale', 'Procession', 'Concile', 'Evangile', 'Parchemin', 'Scriptorium', 'Chronologie',
  'Calendrier', 'Equinoxe', 'Solstice', 'Navigation', 'Caravelle', 'Boussole', 'Longitude', 'Latitude', 'Estuaire', 'Conquete',
  'Explorateur', 'Pionnier', 'Cartouche', 'Dynaste', 'Investiture', 'Coronation', 'Diplomatie', 'Trone', 'Regent', 'Memorial',
];

export const UNIVERSES: UniverseConfig[] = [
  {
    id: 'frontieres',
    label: 'Frontieres Stellaires',
    description: 'L’homme explore les étoiles, cherchant des réponses dans l’infini. Les machines rêvent, et les mondes s’illuminent d’avenir et de mystère...',
    genre: 'Science-fiction',
    ton: 'Intense',
    pov: 'tu',
    words: FRONTIER_WORDS,
  },
  {
    id: 'arcanes',
    label: 'Mythes et Arcanes',
    description: 'Dragons et magie s’affrontent sous un ciel d’orage. Les anciens pouvoirs se réveillent, façonnant le destin des royaumes oubliés...',
    genre: 'Fantasy',
    ton: 'Epique',
    pov: 'tu',
    words: ARCANE_WORDS,
  },
  {
    id: 'metropole',
    label: 'Enigmes Urbaines',
    description: 'La ville ne dort jamais. Sous la pluie, la vérité se cache entre les néons, prête à trahir celui qui la cherche...',
    genre: 'Thriller urbain',
    ton: 'Sombre',
    pov: 'tu',
    words: METRO_WORDS,
  },
  {
    id: 'heritages',
    label: 'Chroniques Historiques',
    description: 'Le fracas du fer résonne. Les empires naissent et s’effondrent, mais les héros demeurent dans la poussière du temps...',
    genre: 'Historique',
    ton: 'Dramatique',
    pov: 'tu',
    words: HERITAGE_WORDS,
  },
];

export function getUniverseById(id: string): UniverseConfig | undefined {
  return UNIVERSES.find((universe) => universe.id === id);
}
