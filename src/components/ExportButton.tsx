import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ExportButton({ targetId = 'dashboard-export' }: { targetId?: string }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const el = document.getElementById(targetId);
      if (!el) {
        toast.error('No se encontró el elemento a exportar.');
        return;
      }

      const canvas = await html2canvas(el, {
        backgroundColor: '#030d14',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;

      // Header
      pdf.setFillColor(3, 13, 20);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(0, 255, 136);
      pdf.text('CuotaCtrl', margin, 20);

      const now = new Date();
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 120, 140);
      pdf.text(
        `Reporte: ${now.toLocaleString('es-AR', { month: 'long', year: 'numeric' })}`,
        margin, 28,
      );
      pdf.text(`Generado: ${now.toLocaleDateString('es-AR')}`, margin, 34);

      // Divider
      pdf.setDrawColor(0, 255, 136, 30);
      pdf.line(margin, 38, pageWidth - margin, 38);

      // Content image
      const imgHeight = (canvas.height / canvas.width) * contentWidth;
      const maxImgHeight = pageHeight - 50;
      const finalHeight = Math.min(imgHeight, maxImgHeight);

      pdf.addImage(imgData, 'PNG', margin, 42, contentWidth, finalHeight);

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(50, 70, 90);
      pdf.text('Exportado con CuotaCtrl • cuotactrl.app', margin, pageHeight - 6);

      const filename = `CuotaCtrl-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.pdf`;
      pdf.save(filename);
      toast.success(`PDF exportado: ${filename}`);
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="gap-2 border-border/50 bg-secondary/30 hover:bg-secondary/80"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
      <span className="hidden sm:inline">{loading ? 'Exportando...' : 'Exportar PDF'}</span>
    </Button>
  );
}
