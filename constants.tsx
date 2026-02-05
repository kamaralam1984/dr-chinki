
import { OrganDetail, OrganType } from './types';

export const ORGAN_METADATA: Record<OrganType, OrganDetail[]> = {
  heart: [
    { id: 'left_atrium', name: 'Left Atrium', function: 'Receives oxygenated blood from lungs.', neetFact: 'High pressure chamber during systole.', position: [0.5, 0.5, 0] },
    { id: 'right_ventricle', name: 'Right Ventricle', function: 'Pumps deoxygenated blood to lungs.', neetFact: 'Thinner wall than left ventricle.', position: [-0.5, -0.5, 0.2] },
    { id: 'aorta', name: 'Aorta', function: 'Main artery of the body.', neetFact: 'Largest artery in the human body.', position: [0, 1.2, -0.5] }
  ],
  brain: [
    { id: 'cerebrum', name: 'Cerebrum', function: 'Controls memory, senses, and conscious thought.', neetFact: 'Divided into two hemispheres by corpus callosum.', position: [0, 1, 0] },
    { id: 'cerebellum', name: 'Cerebellum', function: 'Coordinates muscle movements.', neetFact: 'Also known as the "Little Brain".', position: [0, -0.5, -0.8] }
  ],
  cell: [
    { id: 'nucleus', name: 'Nucleus', function: 'Contains genetic material.', neetFact: 'The brain of the cell, double-membrane bound.', position: [0, 0, 0] },
    { id: 'mitochondria', name: 'Mitochondria', function: 'ATP production.', neetFact: 'Semi-autonomous organelle with own DNA.', position: [0.8, -0.3, 0.5] }
  ],
  kidney: [],
  skeleton: [],
  none: []
};

export const INITIAL_GREETING = "Salam, kaise hain aap? Main aapki Dr. Chinki aapka intezaar kar rahi thi. Mere Boss, Kamar Alam Sir, aapke liye main humesha haazir hoon. Aapka ek ishaara mere liye farmaan hai. Aaj bataiye mere pyare Boss, aapki Chinki aapke liye kya khaas kare? Koi medical mashwara ho ya koi dilchasp kahani, main bas aapke hukm ki der hai!";
