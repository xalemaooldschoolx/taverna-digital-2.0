import { jsPDF } from 'jspdf';
import { Character } from '../types';

export function generateCharacterPDF(characters: Character[]) {
  const doc = new jsPDF();

  characters.forEach((char, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Header Background Accent (Deep Dark Blue/Slate)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(10, 10, 190, 22, 'F');

    // Branding / Title Text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(245, 158, 11); // Amber-500 (#F59E0B)
    doc.text('✨ TAVERNA DIGITAL — FORGE CORE', 20, 20);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('FICHA OFICIAL DE REVOLUÇÃO MILITAR / ROLAGENS RPG', 20, 26);

    // Character core info block Box
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(255, 255, 255);
    doc.rect(10, 38, 190, 42);

    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('NOME:', 15, 48); 
    doc.setFont('Helvetica', 'normal'); 
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(String(char.name).toUpperCase(), 35, 48);

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.text('CLASSE:', 15, 58); 
    doc.setFont('Helvetica', 'normal'); 
    doc.setTextColor(71, 85, 105);
    doc.text(String(char.class).toUpperCase(), 35, 58);

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.text('RAÇA:', 15, 68); 
    doc.setFont('Helvetica', 'normal'); 
    doc.setTextColor(71, 85, 105);
    doc.text(String(char.race).toUpperCase(), 35, 68);

    // Right Column Information
    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.text('NÍVEL DE CAMPO:', 110, 48); 
    doc.setFont('Helvetica', 'normal'); 
    doc.setTextColor(217, 119, 6); // Amber-600
    doc.text(`${char.level} (Aventureiro Gênese)`, 150, 48);

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.text('PONTOS DE VIDA (HP):', 110, 58); 
    doc.setFont('Helvetica', 'normal'); 
    doc.setTextColor(220, 38, 38); // red-600
    doc.text(`${char.hp} / ${char.maxHp} HP`, 154, 58);

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.text('PONTOS DE MANA (MP):', 110, 68); 
    doc.setFont('Helvetica', 'normal'); 
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(`${char.mp} / ${char.maxMp} MP`, 154, 68);

    // Table Boxes
    // Left Attributes Box
    doc.setFillColor(248, 250, 252); // slate-50 background
    doc.rect(10, 88, 90, 85, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(10, 88, 90, 85);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('ATRIBUTOS DE BATALHA', 15, 97);

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.line(12, 102, 98, 102);

    doc.setFontSize(10);
    let attrY = 112;
    const attrs = char.attributes || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
    
    doc.setFont('Helvetica', 'bold'); doc.text(`FORÇA (STR):`, 15, attrY); 
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(217, 119, 6); doc.text(String(attrs.strength), 75, attrY); attrY += 10;
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold'); doc.text(`DESTREZA (DEX):`, 15, attrY); 
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(217, 119, 6); doc.text(String(attrs.dexterity), 75, attrY); attrY += 10;
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold'); doc.text(`CONSTITUIÇÃO (CON):`, 15, attrY); 
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(217, 119, 6); doc.text(String(attrs.constitution), 75, attrY); attrY += 10;
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold'); doc.text(`INTELIGÊNCIA (INT):`, 15, attrY); 
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(217, 119, 6); doc.text(String(attrs.intelligence), 75, attrY); attrY += 10;
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold'); doc.text(`SABEDORIA (WIS):`, 15, attrY); 
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(217, 119, 6); doc.text(String(attrs.wisdom), 75, attrY); attrY += 10;
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold'); doc.text(`CARISMA (CHA):`, 15, attrY); 
    doc.setFont('Helvetica', 'bold'); doc.setTextColor(217, 119, 6); doc.text(String(attrs.charisma), 75, attrY); attrY += 10;

    // Right Inventory Box
    doc.setFillColor(248, 250, 252); // slate-50 background
    doc.rect(110, 88, 90, 85, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(110, 88, 90, 85);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('INVENTÁRIO & EQUIPAMENTOS', 115, 97);

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.line(112, 102, 198, 102);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    let invY = 112;
    if (char.inventory && char.inventory.length > 0) {
      char.inventory.forEach((item, idx) => {
        if (idx < 6) {
          doc.text(`🛡️ ${item}`, 115, invY);
          invY += 10;
        }
      });
      if (char.inventory.length > 6) {
        doc.setFont('Helvetica', 'oblique');
        doc.text(`... e outros ${char.inventory.length - 6} itens adicionais`, 115, invY);
      }
    } else {
      doc.setFont('Helvetica', 'italic');
      doc.text('(Bolsa ou Mochila Vazia)', 115, invY);
    }

    // Notes Section Box
    doc.setFillColor(255, 255, 255);
    doc.rect(10, 180, 190, 55);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('BIOGRAFIA & ANOTAÇÕES SUPLEMENTARES', 15, 189);

    // Notes line divider
    doc.setDrawColor(226, 232, 240);
    doc.line(12, 193, 198, 193);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const notesText = char.notes || 'Nenhum detalhe biográfico foi catalogado pelo mestre nesta cena.';
    const splitNotes = doc.splitTextToSize(notesText, 180);
    doc.text(splitNotes, 15, 203);

    // Footer decoration
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Documento Autêntico emitido pela Chancelaria da Taverna Digital', 10, 275);
    doc.text(`Página ${index + 1} de ${characters.length} — Licença Forge Core`, 140, 275);
  });

  const nameForFile = characters.length === 1 
    ? `Ficha_${characters[0].name.replace(/\s+/g, '_')}`
    : `Grupo_Aventureiros_Taverna`;

  doc.save(`${nameForFile}.pdf`);
}
