import puppeteer from 'puppeteer';

export class TemplateCompiler {
  static extractVariables(html) {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  }

  static validatePlaceholders(html, data) {
    const variables = this.extractVariables(html);
    const missingVars = [];
    
    variables.forEach(variable => {
      const keys = variable.split('.');
      let current = data;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          missingVars.push(variable);
          break;
        }
      }
    });
    
    return missingVars;
  }

  static replaceVariables(html, data) {
    console.log('Replacing variables with data:', data);
    
    // Smart replacements for common hardcoded values
    if (data.student) {
      // Replace common student name patterns
      html = html.replace(/John Doe|Jane Smith|Student Name|Sample Student/gi, data.student.name || 'Student');
      html = html.replace(/\b1254\b|\b001\b|\bRoll\s*Number\b(?!:)/gi, data.student.rollNumber || 'N/A');
      html = html.replace(/10\s*[–-]\s*A|9\s*[–-]\s*B|Class\s*&\s*Section(?!:)/gi, `${data.student.class || 'N/A'} – ${data.student.section || 'N/A'}`);
      html = html.replace(/Michael Doe|Father.*Name(?!:)/gi, data.student.fatherName || 'N/A');
      html = html.replace(/A-?12345|A-?12346|ADM\d+/gi, data.student.admissionNumber || 'N/A');
    }
    
    if (data.result) {
      // Replace result-specific hardcoded values
      html = html.replace(/\b450\b|\b500\b/g, data.result.totalMarks || '0');
      html = html.replace(/\b380\b|\b420\b/g, data.result.obtainedMarks || '0');
      html = html.replace(/84\.4%|85%|90%/g, `${data.result.percentage || '0'}%`);
      html = html.replace(/\bA\+?\b|\bB\+?\b(?!\s*\+)/g, data.result.grade || 'N/A');
      
      // Replace hardcoded subject marks
      html = html.replace(/\b85\b(?=.*Mathematics)/gi, data.result.subjects?.[0]?.marksObtained || '85');
      html = html.replace(/\b78\b(?=.*Science)/gi, data.result.subjects?.[1]?.marksObtained || '78');
      html = html.replace(/\b100\b(?=.*Max.*Marks)/gi, '100'); // Keep max marks as 100
    }
    
    if (data.school) {
      // Replace school name patterns
      html = html.replace(/Green Valley Public School|Green Valley International School|Sample School|School Name/gi, data.school.name || 'School');
      html = html.replace(/123 School Street, City|123 Maple Avenue, Cityname|School Address/gi, data.school.address || 'School Address');
      html = html.replace(/\+1234567890|\+91 98765 43210/gi, data.school.phone || 'Phone');
      html = html.replace(/info@school\.com/gi, data.school.email || 'Email');
    }
    
    if (data.exam) {
      // Replace exam patterns
      html = html.replace(/Annual Examination|Mid Term Examination|Sample Exam/gi, data.exam.name || 'Examination');
      html = html.replace(/10 March – 20 March 2025|Exam Dates?/gi, data.exam.date || 'Exam Date');
      html = html.replace(/Unit Test|Mid Term|Final/gi, data.exam.type || 'Examination');
    }
    
    // Handle subject rows for results - only replace if template has subject placeholders
    if (data.result && data.result.subjects && Array.isArray(data.result.subjects)) {
      // Replace subject table rows if template has them
      if (html.includes('{{#each result.subjects}}') || html.includes('{{result.subjects}}')) {
        const subjectRows = data.result.subjects.map(subject => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">${subject.subjectName || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${subject.maxMarks || 0}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${subject.marksObtained || 0}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${subject.grade || 'N/A'}</td>
          </tr>
        `).join('');
        
        // Replace placeholder rows
        html = html.replace(
          /<tr>\s*<td[^>]*>Sample Subject<\/td>[\s\S]*?<\/tr>/g,
          subjectRows
        );
      }
    }
    
    // Handle exam schedule for admit cards
    if (data.examSchedule && Array.isArray(data.examSchedule)) {
      const scheduleRows = data.examSchedule.map(schedule => `
        <tr>
          <td style="text-align: left; font-weight: bold;">${schedule.subject || 'N/A'}</td>
          <td>${schedule.date || 'N/A'}</td>
          <td>${schedule.time || 'N/A'}</td>
          <td>${schedule.duration || 'N/A'}</td>
        </tr>
      `).join('');
      
      // Replace {{#each examSchedule}} blocks
      html = html.replace(
        /\{\{#each examSchedule\}\}[\s\S]*?\{\{\/each\}\}/g,
        scheduleRows
      );
    }
    
    // Regular {{variable}} replacement
    html = html.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const keys = variable.trim().split('.');
      let value = data;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return match;
        }
      }
      
      return value !== null && value !== undefined ? String(value) : '';
    });
    
    console.log('HTML after replacement preview:', html.substring(0, 300));
    return html;
  }

  static async generatePDF(html, css = '') {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            ${css}
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;
      
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
      });
      
      return pdf.toString('base64');
    } finally {
      await browser.close();
    }
  }

  static getDefaultData() {
    return {}; // Return empty object - no hardcoded data
  }
}

export default TemplateCompiler;