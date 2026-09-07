import { StylePreset, CameraPreset } from '../types';

export const IMAGE_STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cinematic',
    name: 'Cinématique 35mm',
    category: 'Cinéma',
    promptSuffix: ', 35mm film photograph, cinematic lighting, shallow depth of field, anamorphic lens flare, Kodak Portra color palette, award-winning cinematography',
    previewGradient: 'from-amber-600 to-slate-800',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk & Néon',
    category: 'Sci-Fi',
    promptSuffix: ', cyberpunk neon aesthetic, glowing volumetric holograms, rain-slicked asphalt, vibrant magenta and cyan rim lights, futuristic Tokyo vibe',
    previewGradient: 'from-fuchsia-600 to-indigo-800',
  },
  {
    id: 'anime',
    name: 'Animation Japonaise',
    category: 'Illustration',
    promptSuffix: ', Makoto Shinkai and Studio Ghibli inspired anime art, luminous painted clouds, golden hour lighting, clean detailed linework, nostalgic atmosphere',
    previewGradient: 'from-sky-500 to-indigo-600',
  },
  {
    id: '3d-clay',
    name: 'Rendu 3D & Argile',
    category: 'Digital 3D',
    promptSuffix: ', 3D Octane clay render, softbox studio lighting, subsurface scattering, tactile matte finish, rounded stylized proportions, Pixar style',
    previewGradient: 'from-indigo-500 to-violet-700',
  },
  {
    id: 'photorealistic',
    name: 'Photoréalisme Macro',
    category: 'Nature & Photo',
    promptSuffix: ', National Geographic style macro photography, Hasselblad H6D-100c, extreme micro-textures, natural crisp daylight, 8k hyper-detailed',
    previewGradient: 'from-emerald-500 to-teal-800',
  },
  {
    id: 'watercolor',
    name: 'Aquarelle & Encre',
    category: 'Art Plastique',
    promptSuffix: ', delicate watercolor wash and Japanese sumi-e ink painting, fluid pigment bleeds on textured cold-press cotton paper, expressive negative space',
    previewGradient: 'from-rose-500 to-amber-700',
  },
  {
    id: 'dark-fantasy',
    name: 'Dark Fantasy Gothique',
    category: 'Fantastique',
    promptSuffix: ', gothic dark fantasy concept art, dramatic Caravaggio chiaroscuro lighting, heavy atmospheric mist, ancient weathered stone, ominous mood',
    previewGradient: 'from-slate-700 to-zinc-950',
  },
  {
    id: 'synthwave',
    name: 'Rétro Synthwave 80s',
    category: 'Rétro',
    promptSuffix: ', 1980s synthwave vaporwave aesthetic, glowing neon grid horizon, giant striped sunset, chrome reflections, subtle VHS grain',
    previewGradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'surrealism',
    name: 'Surréalisme Onirique',
    category: 'Onirique',
    promptSuffix: ', modern dreamlike surrealism, René Magritte and Dali influence, impossible floating architecture, hyperrealistic physical lighting and physics',
    previewGradient: 'from-teal-500 to-blue-700',
  },
  {
    id: 'bauhaus',
    name: 'Minimalisme Bauhaus',
    category: 'Design Graphique',
    promptSuffix: ', Bauhaus minimalist graphic illustration, risograph texture, pure primary geometric shapes, bold clean composition, textured screenprint paper',
    previewGradient: 'from-amber-500 to-red-600',
  },
];

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'none',
    name: 'Standard Naturel',
    description: 'Mouvement fluide et naturel adapté à la scène',
    promptInstruction: '',
  },
  {
    id: 'zoom-in',
    name: 'Travelling Avant (Push In)',
    description: 'La caméra avance doucement vers le sujet principal pour intensifier l\'émotion',
    promptInstruction: 'smooth cinematic slow push in camera zoom towards the subject',
  },
  {
    id: 'pan-horizontal',
    name: 'Panoramique Fluide',
    description: 'Balayage horizontal majestueux découvrant le décor',
    promptInstruction: 'majestic smooth horizontal panning camera shot across the environment',
  },
  {
    id: 'aerial-drone',
    name: 'Vue Aérienne par Drone',
    description: 'Survol en plongée avec perspective grandiose',
    promptInstruction: 'sweeping cinematic aerial drone shot gliding smoothly overhead with high altitude perspective',
  },
  {
    id: 'orbit',
    name: 'Orbite Circulaire 360°',
    description: 'La caméra tourne harmonieusement autour du sujet',
    promptInstruction: 'fluid cinematic 360 degree orbital camera movement revolving around the subject',
  },
  {
    id: 'slow-motion',
    name: 'Ralenti Cinématographique',
    description: 'Mouvement ralenti haute vitesse captant chaque goutte ou étincelle',
    promptInstruction: 'ultra smooth 120fps slow motion cinematic shot capturing subtle physical details',
  },
];

export const SAMPLE_PROMPTS = [
  {
    type: 'image' as const,
    title: 'Renard mystique dans la brume',
    prompt: 'Un renard aux reflets dorés assis au milieu d\'une forêt automnale brumeuse, feuilles d\'érable rougeoyantes au sol, rayon de soleil matinal perçant les branches.',
  },
  {
    type: 'image' as const,
    title: 'Cité flottante steampunk',
    prompt: 'Une immense cité victorienne suspendue dans les nuages avec des dirigeables en laiton, engrenages d\'horlogerie et cascades d\'eau tombant dans le vide.',
  },
  {
    type: 'video' as const,
    title: 'Voiture de sport néon sous la pluie',
    prompt: 'Une supercar futuriste glissant à toute vitesse sur une autoroute côtière mouillée au crépuscule, traînées lumineuses néon rouge et reflets d\'eau sur l\'asphalte.',
  },
  {
    type: 'video' as const,
    title: 'Exploration sous-marine bioluminescente',
    prompt: 'Un plongeur explorant un récif de coraux extraterrestres qui s\'illuminent au toucher avec des méduses translucides qui ondulent gracieusement.',
  },
];
