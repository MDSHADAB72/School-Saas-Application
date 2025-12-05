import Template from '../models/Template.js';
import TemplateCompiler from '../utils/templateCompiler.js';

export const createTemplate = async (req, res) => {
  try {
    console.log('Create template request:', req.body);
    console.log('User:', req.user);
    
    const { type, name, html, css, isDefault } = req.body;
    const schoolId = req.user.schoolId;
    const createdBy = req.user.userId;

    console.log('School ID:', schoolId, 'Created By:', createdBy);

    // Extract variables from HTML
    const variables = TemplateCompiler.extractVariables(html);
    console.log('Extracted variables:', variables);

    // If setting as default, unset other defaults
    if (isDefault) {
      await Template.updateMany(
        { schoolId, type, isDefault: true },
        { isDefault: false }
      );
    }

    // Get next version number
    const lastTemplate = await Template.findOne({ schoolId, type })
      .sort({ version: -1 });
    const version = lastTemplate ? lastTemplate.version + 1 : 1;
    console.log('Version:', version);

    const template = new Template({
      schoolId,
      type,
      name,
      html,
      css,
      variables,
      isDefault,
      version,
      createdBy
    });

    console.log('Saving template...');
    await template.save();
    console.log('Template saved successfully');
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create template',
      error: error.message 
    });
  }
};

export const getTemplatesBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { type } = req.query;

    const filter = { schoolId, active: true };
    if (type) filter.type = type;

    const templates = await Template.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch templates',
      error: error.message 
    });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.findById(id)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch template',
      error: error.message 
    });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, html, css, isDefault } = req.body;
    const updatedBy = req.user.userId;

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }

    // Extract variables from updated HTML
    const variables = TemplateCompiler.extractVariables(html);

    // If setting as default, unset other defaults
    if (isDefault && !template.isDefault) {
      await Template.updateMany(
        { schoolId: template.schoolId, type: template.type, isDefault: true },
        { isDefault: false }
      );
    }

    // Increment version
    template.version += 1;
    template.name = name;
    template.html = html;
    template.css = css;
    template.variables = variables;
    template.isDefault = isDefault;
    template.updatedBy = updatedBy;

    await template.save();
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update template',
      error: error.message 
    });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }

    template.active = false;
    await template.save();

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete template',
      error: error.message 
    });
  }
};

export const setDefaultTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }

    // Unset other defaults
    await Template.updateMany(
      { schoolId: template.schoolId, type: template.type, isDefault: true },
      { isDefault: false }
    );

    // Set this as default
    template.isDefault = true;
    await template.save();

    res.json({ success: true, message: 'Default template set successfully' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to set default template',
      error: error.message 
    });
  }
};

export const renderTemplate = async (req, res) => {
  try {
    const { templateId, data } = req.body;
    
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }

    // Use provided data - no fallback to default
    if (!data) {
      return res.status(400).json({ 
        success: false, 
        message: 'Template data is required' 
      });
    }

    console.log('Template render - received data:', JSON.stringify(data, null, 2));

    // Replace variables
    const compiledHtml = TemplateCompiler.replaceVariables(template.html, data);
    console.log('Template render - compiled HTML preview:', compiledHtml.substring(0, 200));

    // Generate PDF
    const pdfBase64 = await TemplateCompiler.generatePDF(compiledHtml, template.css);

    res.json({
      success: true,
      data: {
        pdf: pdfBase64,
        html: compiledHtml
      }
    });
  } catch (error) {
    console.error('Template render error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to render template',
      error: error.message 
    });
  }
};

export const previewTemplate = async (req, res) => {
  try {
    console.log('Preview request received:', req.body);
    const { html, css } = req.body;
    
    if (!html) {
      return res.status(400).json({
        success: false,
        message: 'HTML content is required'
      });
    }
    
    // Use sample data for preview
    const templateData = {
      student: {
        name: 'John Doe',
        rollNumber: '67',
        class: '9',
        section: 'D',
        fatherName: 'Michael Doe',
        dateOfBirth: '5/3/2006'
      },
      school: {
        name: 'Green Valley School'
      },
      exam: {
        date: '10 March – 20 March 2025'
      }
    };
    
    // Replace variables
    const compiledHtml = TemplateCompiler.replaceVariables(html, templateData);
    const variables = TemplateCompiler.extractVariables(html);
    
    // Combine HTML and CSS for preview
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          ${css || ''}
        </style>
      </head>
      <body>
        ${compiledHtml}
      </body>
      </html>
    `;
    
    console.log('Preview generated successfully');
    res.json({
      success: true,
      data: {
        html: fullHtml,
        variables: variables
      }
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to preview template',
      error: error.message 
    });
  }
};