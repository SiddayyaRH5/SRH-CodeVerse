package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.IssuedCertificate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Minimal, dependency-free PDF writer for certificate downloads. It produces a
 * valid single page PDF (A4 landscape) with the CodeVerse certificate layout.
 */
@Service
public class CertificatePdfService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMMM yyyy");

    public byte[] generate(IssuedCertificate certificate) {
        List<String> content = new ArrayList<>();
        content.add("0.42 0.16 0.85 RG");
        content.add("3 w");
        content.add("28 28 786 539 re S");
        content.add("0.10 0.70 0.85 RG");
        content.add("1 w");
        content.add("40 40 762 515 re S");

        text(content, "F2", 16, 421, 512, "SRH CODEVERSE");
        text(content, "F1", 9, 421, 494, "LEARN. PRACTICE. BUILD. GROW.");

        text(content, "F2", 30, 421, 430, "CERTIFICATE");
        text(content, "F1", 14, 421, 402, "OF ACHIEVEMENT");

        text(content, "F1", 11, 421, 352, "This certifies that");

        String name = ascii(certificate.getUser().getUsername());
        text(content, "F2", 26, 421, 312, name);

        text(content, "F1", 11, 421, 270, "has successfully completed the requirements for");

        String title = ascii(certificate.getDefinition().getTitle());
        text(content, "F2", 20, 421, 232, title);

        String issued = certificate.getIssuedAt() == null ? "" : certificate.getIssuedAt().format(DATE);
        text(content, "F1", 10, 150, 110, "Issued: " + issued);
        text(content, "F1", 10, 421, 110, "Certificate ID: " + certificate.getCertificateNumber());
        if (certificate.getScorePercent() != null) {
            text(content, "F1", 10, 660, 110, "Assessment: " + certificate.getScorePercent() + "%");
        }

        text(content, "F1", 9, 421, 72, "Verify at SRH CodeVerse using code: " + certificate.getVerificationCode());
        text(content, "F1", 8, 421, 56, "This certificate is digitally recorded and can be verified at any time.");

        byte[] stream = String.join("\n", content).getBytes(StandardCharsets.ISO_8859_1);
        return buildPdf(stream);
    }

    private void text(List<String> content, String font, int size, int centerX, int y, String value) {
        String safe = ascii(value);
        double estimatedWidth = safe.length() * size * 0.5;
        int x = Math.max(45, (int) Math.round(centerX - estimatedWidth / 2.0));
        content.add("BT");
        content.add("/" + font + " " + size + " Tf");
        content.add("0.08 0.09 0.12 rg");
        content.add(x + " " + y + " Td");
        content.add("(" + escape(safe) + ") Tj");
        content.add("ET");
    }

    private String ascii(String value) {
        if (value == null) return "";
        StringBuilder builder = new StringBuilder();
        for (char c : value.toCharArray()) {
            builder.append(c >= 32 && c <= 126 ? c : ' ');
        }
        return builder.toString();
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }

    private byte[] buildPdf(byte[] stream) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        List<Integer> offsets = new ArrayList<>();
        write(out, "%PDF-1.4\n");

        offsets.add(out.size());
        write(out, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

        offsets.add(out.size());
        write(out, "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

        offsets.add(out.size());
        write(out, "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] "
                + "/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>\nendobj\n");

        offsets.add(out.size());
        write(out, "4 0 obj\n<< /Length " + stream.length + " >>\nstream\n");
        out.writeBytes(stream);
        write(out, "\nendstream\nendobj\n");

        offsets.add(out.size());
        write(out, "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

        offsets.add(out.size());
        write(out, "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

        int xref = out.size();
        StringBuilder table = new StringBuilder();
        table.append("xref\n0 7\n");
        table.append("0000000000 65535 f \n");
        for (Integer offset : offsets) {
            table.append(String.format("%010d 00000 n \n", offset));
        }
        table.append("trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n").append(xref).append("\n%%EOF\n");
        write(out, table.toString());
        return out.toByteArray();
    }

    private void write(ByteArrayOutputStream out, String value) {
        out.writeBytes(value.getBytes(StandardCharsets.ISO_8859_1));
    }
}
