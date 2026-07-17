import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatBRL } from '../utils';
import type { FinanceiroItem, PedidoMaterial } from '../types';

const PINK: [number, number, number] = [255, 183, 197];

function header(doc: jsPDF, title: string) {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GP:OBRA', 14, 16);
  doc.setFontSize(12);
  doc.text(title, 14, 24);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-br')}`, 14, 30);
  doc.setTextColor(0);
}

export function generateFinanceiroReport(financeiro: FinanceiroItem[]) {
  const doc = new jsPDF();
  header(doc, 'Relatório Financeiro');

  const total = financeiro.reduce((acc, f) => acc + f.valor_pago, 0);
  autoTable(doc, {
    head: [['Data', 'Descrição', 'Valor']],
    body: financeiro.map((f) => [
      new Date(f.created_at).toLocaleDateString('pt-br'),
      f.descricao,
      `R$ ${formatBRL(f.valor_pago)}`,
    ]),
    foot: [['', 'TOTAL INVESTIDO', `R$ ${formatBRL(total)}`]],
    startY: 36,
    theme: 'striped',
    headStyles: { fillColor: PINK, textColor: [0, 0, 0] },
    footStyles: { fillColor: [20, 22, 26], textColor: [255, 255, 255], fontStyle: 'bold' },
  });
  doc.save('Financeiro_Obra.pdf');
}

export function generateMateriaisReport(pedidos: PedidoMaterial[]) {
  const doc = new jsPDF();
  header(doc, 'Relatório de Materiais');

  const pendentes = pedidos.filter((p) => p.status === 'pendente').length;
  autoTable(doc, {
    head: [['Data', 'Material', 'Qtd', 'Urgência', 'Status']],
    body: pedidos.map((p) => [
      new Date(p.created_at).toLocaleDateString('pt-br'),
      p.material,
      p.quantidade,
      p.urgencia.toUpperCase(),
      p.status.toUpperCase(),
    ]),
    foot: [['', `${pedidos.length} pedidos (${pendentes} pendentes)`, '', '', '']],
    startY: 36,
    theme: 'striped',
    headStyles: { fillColor: PINK, textColor: [0, 0, 0] },
    footStyles: { fillColor: [20, 22, 26], textColor: [255, 255, 255], fontStyle: 'bold' },
  });
  doc.save('Materiais_Obra.pdf');
}
