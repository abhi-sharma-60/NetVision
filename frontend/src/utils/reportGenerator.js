import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateSecurityReport = (threatAlerts, livePackets, analytics) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleString();

  // 1. Header
  doc.setFontSize(22);
  doc.setTextColor(220, 38, 38); // Red
  doc.text('NetVision AI', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Automated Security Incident Report', 14, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${date}`, 14, 38);
  doc.line(14, 42, 196, 42);

  let cursorY = 50;

  // 2. Traffic Trends Summary
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Traffic Trends & Network Health', 14, cursorY);
  cursorY += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Packets Monitored: ${analytics?.total_packets || 0}`, 14, cursorY);
  cursorY += 6;
  doc.text(`Total Bandwidth (Bytes): ${analytics?.total_bytes || 0}`, 14, cursorY);
  cursorY += 6;
  doc.text(`Current Traffic Rate: ${analytics?.packets_per_second || 0} pps`, 14, cursorY);
  cursorY += 15;

  // 3. Top Hosts
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Top Traffic Origins (Geo-Mapped)', 14, cursorY);
  cursorY += 5;

  const locations = new Map();
  livePackets.forEach(p => {
    [p.src_geo, p.dst_geo].forEach(geo => {
      if (geo && geo.country) {
        const loc = geo.country;
        locations.set(loc, (locations.get(loc) || 0) + 1);
      }
    });
  });
  const sortedLocs = Array.from(locations.entries()).sort((a,b) => b[1]-a[1]).slice(0, 5);
  
  const hostData = sortedLocs.map(([country, count]) => [country, `${count} packets`]);
  
  if (hostData.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Country', 'Traffic Volume']],
      body: hostData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
    cursorY = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.text("No external geo-locations detected in recent traffic.", 14, cursorY + 5);
    cursorY += 20;
  }

  // 4. Anomalies & Threat Summary
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  doc.text('Detected Threats & Anomalies', 14, cursorY);
  cursorY += 5;

  if (threatAlerts && threatAlerts.length > 0) {
    const alertData = threatAlerts.slice(0, 10).map(alert => [
      alert.severity,
      alert.type,
      alert.src_ip,
      alert.message
    ]);
    
    autoTable(doc, {
      startY: cursorY,
      head: [['Severity', 'Type', 'Source IP', 'Description']],
      body: alertData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
    });
    cursorY = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94); // Green
    doc.text("No active threats or anomalies detected.", 14, cursorY + 5);
    cursorY += 20;
  }

  // 5. AI Recommendations
  if (cursorY > 230) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('AI Incident Recommendations', 14, cursorY);
  cursorY += 10;

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  
  const uniqueThreatIps = Array.from(new Set(threatAlerts.map(a => a.src_ip)));
  
  if (uniqueThreatIps.length > 0) {
    doc.text(`CRITICAL: Immediate action required.`, 14, cursorY);
    cursorY += 7;
    doc.text(`1. Block the following anomalous IPs at the firewall level:`, 14, cursorY);
    cursorY += 7;
    uniqueThreatIps.slice(0, 5).forEach(ip => {
      doc.text(`   - ${ip}`, 14, cursorY);
      cursorY += 6;
    });
    doc.text(`2. Investigate endpoints exhibiting high-frequency irregular protocols.`, 14, cursorY);
    cursorY += 6;
    doc.text(`3. Isolate affected subnets temporarily to prevent lateral movement.`, 14, cursorY);
  } else {
    doc.text(`1. Network traffic is within normal ML bounds. No blocking required.`, 14, cursorY);
    cursorY += 7;
    doc.text(`2. Continue monitoring zero-day baseline behaviors.`, 14, cursorY);
    cursorY += 7;
    doc.text(`3. Ensure OS and software patching is up-to-date across local clients.`, 14, cursorY);
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount} | NetVision AI Security Platform`, 14, 290);
  }

  // Download
  doc.save(`NetVision_AI_Report_${Date.now()}.pdf`);
};
