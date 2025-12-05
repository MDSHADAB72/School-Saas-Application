import Template from '../models/Template.js';

const sampleTemplates = [
  {
    type: 'FEE_RECEIPT',
    name: 'Standard Fee Receipt',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">{{school.name}}</h1>
          <p style="margin: 5px 0;">{{school.address}}</p>
          <p style="margin: 5px 0;">Phone: {{school.phone}} | Email: {{school.email}}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; text-align: center; margin: 0;">FEE RECEIPT</h2>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Receipt No:</strong> {{fee.receiptNumber}}</p>
          <p><strong>Date:</strong> {{date.today}}</p>
          <p><strong>Student Name:</strong> {{student.name}}</p>
          <p><strong>Class:</strong> {{student.class}} - {{student.section}}</p>
          <p><strong>Roll Number:</strong> {{student.rollNumber}}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background: #e9ecef;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Description</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Amount</th>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">Amount Paid</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">₹{{fee.amountPaid}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">Total Amount</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">₹{{fee.totalAmount}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Due Amount</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;"><strong>₹{{fee.dueAmount}}</strong></td>
          </tr>
        </table>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 12px; color: #666;">This is a computer generated receipt.</p>
        </div>
      </div>
    `,
    css: `
      @media print {
        body { margin: 0; }
        .no-print { display: none; }
      }
    `,
    isDefault: true
  },
  {
    type: 'ADMIT_CARD',
    name: 'Standard Admit Card',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; border: 2px solid #2c3e50;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">{{school.name}}</h1>
          <p style="margin: 5px 0;">{{school.address}}</p>
        </div>
        
        <div style="background: #2c3e50; color: white; padding: 15px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">ADMIT CARD</h2>
          <p style="margin: 5px 0;">{{exam.name}}</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div style="flex: 1;">
            <p><strong>Student Name:</strong> {{student.name}}</p>
            <p><strong>Class:</strong> {{student.class}} - {{student.section}}</p>
            <p><strong>Roll Number:</strong> {{student.rollNumber}}</p>
            <p><strong>Admission No:</strong> {{student.admissionNumber}}</p>
          </div>
          <div style="width: 100px; height: 120px; border: 1px solid #ddd; text-align: center; line-height: 120px; color: #999;">
            PHOTO
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Exam Date:</strong> {{exam.date}}</p>
          <p><strong>Exam Time:</strong> {{exam.time}}</p>
        </div>
        
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px;">
          <h3 style="margin-top: 0;">Instructions:</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Bring this admit card to the examination hall</li>
            <li>Report 30 minutes before the exam time</li>
            <li>Carry a valid ID proof</li>
            <li>Mobile phones are not allowed in the exam hall</li>
          </ul>
        </div>
        
        <div style="text-align: right; margin-top: 30px;">
          <p>Principal's Signature</p>
          <div style="border-top: 1px solid #000; width: 150px; margin-left: auto; margin-top: 20px;"></div>
        </div>
      </div>
    `,
    css: `
      @media print {
        body { margin: 0; }
      }
    `,
    isDefault: true
  },
  {
    type: 'RESULT_CARD',
    name: 'Standard Result Card',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">{{school.name}}</h1>
          <p style="margin: 5px 0;">{{school.address}}</p>
        </div>
        
        <div style="background: #28a745; color: white; padding: 15px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">RESULT CARD</h2>
          <p style="margin: 5px 0;">{{exam.name}} - {{date.year}}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Student Name:</strong> {{student.name}}</p>
          <p><strong>Class:</strong> {{student.class}} - {{student.section}}</p>
          <p><strong>Roll Number:</strong> {{student.rollNumber}}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background: #e9ecef;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Subject</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Max Marks</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Obtained</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Grade</th>
          </tr>
          <!-- Subject rows will be populated dynamically -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">Sample Subject</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">100</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">85</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">A</td>
          </tr>
          <tr style="background: #f8f9fa; font-weight: bold;">
            <td style="border: 1px solid #ddd; padding: 10px;">Total</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">{{result.totalMarks}}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">{{result.obtainedMarks}}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">{{result.grade}}</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <p><strong>Percentage: {{result.percentage}}%</strong></p>
          <p><strong>Grade: {{result.grade}}</strong></p>
        </div>
        
        <div style="text-align: right; margin-top: 30px;">
          <p>Class Teacher</p>
          <div style="border-top: 1px solid #000; width: 150px; margin-left: auto; margin-top: 20px;"></div>
        </div>
      </div>
    `,
    css: `
      @media print {
        body { margin: 0; }
      }
    `,
    isDefault: true
  },
  {
    type: 'NOTICE',
    name: 'Standard Notice',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">{{school.name}}</h1>
          <p style="margin: 5px 0;">{{school.address}}</p>
          <p style="margin: 5px 0;">Phone: {{school.phone}} | Email: {{school.email}}</p>
        </div>
        
        <div style="background: #dc3545; color: white; padding: 15px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">NOTICE</h2>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Date:</strong> {{date.today}}</p>
          <p><strong>To:</strong> All Students and Parents</p>
        </div>
        
        <div style="margin-bottom: 30px; line-height: 1.6;">
          <h3 style="color: #2c3e50;">Subject: Important Notice</h3>
          <p>This is to inform all students and parents about the upcoming events and important announcements.</p>
          <p>Please ensure to follow all the guidelines and instructions mentioned below:</p>
          <ul style="margin: 15px 0; padding-left: 20px;">
            <li>Regular attendance is mandatory</li>
            <li>Uniform must be worn properly</li>
            <li>Submit all assignments on time</li>
            <li>Follow school discipline</li>
          </ul>
          <p>For any queries, please contact the school office during working hours.</p>
        </div>
        
        <div style="text-align: right; margin-top: 40px;">
          <p><strong>Principal</strong></p>
          <p>{{school.name}}</p>
        </div>
      </div>
    `,
    css: `
      @media print {
        body { margin: 0; }
      }
    `,
    isDefault: true
  }
];

export const seedTemplates = async (schoolId, createdBy) => {
  try {
    for (const templateData of sampleTemplates) {
      const existingTemplate = await Template.findOne({
        schoolId,
        type: templateData.type,
        name: templateData.name
      });

      if (!existingTemplate) {
        const template = new Template({
          ...templateData,
          schoolId,
          createdBy,
          variables: extractVariables(templateData.html)
        });
        await template.save();
        console.log(`Created template: ${templateData.name}`);
      }
    }
  } catch (error) {
    console.error('Error seeding templates:', error);
  }
};

function extractVariables(html) {
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