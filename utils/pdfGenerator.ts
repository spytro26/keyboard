import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { File } from 'expo-file-system';
import { Asset } from 'expo-asset';

export interface PDFData {
  title: string;
  subtitle: string;
  userName?: string; // User's name to replace "Key calculation results"
  projectName?: string; // Project name to show alongside user name
  finalResults?: Array<{
    label: string;
    value: string;
    unit: string;
  }>;
  sections: Array<{
    title: string;
    items: Array<{
      label: string;
      value: string;
      unit: string;
      isHighlighted?: boolean;
    }>;
  }>;
  inputs?: Array<{
    title: string;
    items: Array<{
      label: string;
      value: string;
      unit: string;
    }>;
  }>;
}

const getLogoBase64 = async (): Promise<{
  logo: string;
  watermark: string;
  status: string;
}> => {
  let errorMessage = '';

  // Method 1: Try using the simpler fetch approach first (more reliable)
  try {
    const logoAsset = Asset.fromModule(require('../assets/images/logo.png'));

    // Ensure asset is available
    await logoAsset.downloadAsync();

    if (logoAsset.uri) {
      const response = await fetch(logoAsset.uri);

      if (response.ok) {
        const blob = await response.blob();

        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            if (result && result.length > 50) {
              // Basic validation - base64 should be much longer
              resolve({
                logo: result,
                watermark: result, // Use same image for watermark
                status: '', // Success - no error message
              });
            } else {
              resolve({
                logo: createFallbackSVG(),
                watermark: createFallbackSVG(),
                status: `Logo.png loaded but data was invalid (length: ${
                  result?.length || 0
                })`,
              });
            }
          };
          reader.onerror = () => {
            resolve({
              logo: createFallbackSVG(),
              watermark: createFallbackSVG(),
              status: `FileReader failed to convert logo.png blob to base64`,
            });
          };
          reader.readAsDataURL(blob);
        });
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    } else {
      errorMessage = 'Asset URI was null (asset not found in bundle)';
    }
  } catch (fetchError: any) {
    errorMessage = `Fetch method failed: ${
      fetchError?.message || 'Unknown fetch error'
    }`;
  }

  // Method 2: Try the new File API as backup
  try {
    const logoAsset = Asset.fromModule(require('../assets/images/logo.png'));
    await logoAsset.downloadAsync();

    if (logoAsset.localUri) {
      const file = new File(logoAsset.localUri);
      const base64 = await file.base64();

      if (base64 && base64.length > 50) {
        const fullBase64 = `data:image/png;base64,${base64}`;
        return {
          logo: fullBase64,
          watermark: fullBase64,
          status: '', // Success
        };
      } else {
        errorMessage += ` | File API: base64 was empty or too short`;
      }
    } else {
      errorMessage += ` | File API: localUri was null`;
    }
  } catch (fileError: any) {
    errorMessage += ` | File API failed: ${
      fileError?.message || 'Unknown error'
    }`;
  }

  // If we reach here, both methods failed - return SVG with detailed error
  return {
    logo: createFallbackSVG(),
    watermark: createFallbackSVG(),
    status: `logo.png failed to load: ${errorMessage}`,
  };
};

const createFallbackSVG = () => {
  const svgContent = `
    <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#2563eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="2" stdDeviation="1" flood-color="#1d4ed8" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Outer circle (border) -->
      <circle cx="25" cy="25" r="24" fill="url(#blueGrad)" stroke="#1e40af" stroke-width="1" filter="url(#shadow)"/>
      
      <!-- Inner highlight circle -->
      <circle cx="25" cy="25" r="22" fill="url(#blueGrad)" opacity="0.9"/>
      
      <!-- Company letter -->
      <text x="25" y="33" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" 
            fill="white" text-anchor="middle" 
            style="text-shadow: 0 1px 2px rgba(0,0,0,0.4);">E</text>
            
      <!-- Small accent -->
      <circle cx="35" cy="15" r="3" fill="rgba(255,255,255,0.3)"/>
    </svg>
  `;
  return 'data:image/svg+xml;base64,' + btoa(svgContent.trim());
};

export const generateAndSharePDF = async (data: PDFData) => {
  try {
    // Get the logo as base64
    const logoResult = await getLogoBase64();

    if (logoResult.logo) {
      // Logo loaded successfully - no console needed on mobile
    }

    // On iOS, WebKit lays out print content slightly larger which can push
    // content onto a second page. We pass a platform flag to generate
    // iOS-tuned HTML/CSS that scales content a bit to guarantee a single page
    // without changing Android appearance or pagination.
    const isIOS = Platform.OS === 'ios';
    const htmlContent = generateHTMLContent(
      data,
      logoResult.logo,
      logoResult.watermark,
      logoResult.status,
      isIOS
    );

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    console.log('PDF generated at:', uri);

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      // If sharing is not available, show alternative options
      Alert.alert(
        'Sharing Not Available',
        'Sharing is not available on this platform. The PDF has been generated and saved.',
        [
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
      return;
    }

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${data.title.replace(
      /[^a-zA-Z0-9]/g,
      '_'
    )}_${timestamp}.pdf`;

    // Share the PDF with enhanced options
    console.log('Attempting to share PDF...');
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${data.title}`,
      UTI: 'com.adobe.pdf',
    });

    console.log('PDF shared successfully');
  } catch (error) {
    console.error('Error generating or sharing PDF:', error);

    let errorMessage = 'Failed to generate or share PDF. Please try again.';

    if (error instanceof Error) {
      if (error.message?.includes('User cancelled')) {
        // User cancelled sharing - don't show error
        console.log('User cancelled sharing');
        return;
      } else if (error.message?.includes('not available')) {
        errorMessage = 'Sharing is not available on this device.';
      } else if (error.message?.includes('permission')) {
        errorMessage =
          'Permission denied. Please check your device permissions for sharing files.';
      }
    }

    Alert.alert('Error', errorMessage, [
      {
        text: 'Try Again',
        onPress: () => generateAndSharePDF(data),
        style: 'default',
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  }
};

const generateHTMLContent = (
  data: PDFData,
  logoBase64: string = '',
  watermarkBase64: string = '',
  logoStatus: string = 'No Logo',
  isIOS: boolean = false
): string => {
  const isFreezerDoc = (data?.title || '').toLowerCase().includes('freezer');

  // Create the dynamic header text for main results section
  const mainResultsTitle = (() => {
    if (data.userName && data.projectName) {
      return `<div class="name-project-container">
        <span class="user-name-section">Name: ${data.userName}</span>
        <span class="project-name-section">Project: ${data.projectName}</span>
      </div>`;
    } else if (data.userName) {
      return `<div class="name-project-container">
        <span class="user-name-section">Name: ${data.userName}</span>
      </div>`;
    } else if (data.projectName) {
      return `<div class="name-project-container">
        <span class="project-name-section">Project: ${data.projectName}</span>
      </div>`;
    } else {
      return 'KEY CALCULATION RESULTS'; // Fallback to original text
    }
  })();

  // Create main results section if provided - redesigned
  const mainResultsHTML = data.finalResults
    ? `
    <div class="main-results-section">
      <h2 class="section-title-main">${mainResultsTitle}</h2>
      <div class="main-results-grid ${
        data.finalResults.length === 3 ? 'three-cols' : ''
      }">
        ${data.finalResults
          .map(
            (item) => `
          <div class="main-result-card">
            <div class="main-result-label">${item.label}</div>
            <div class="main-result-value">${item.value} <span class="unit">${item.unit}</span></div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `
    : '';

  // Create outputs section - redesigned
  const outputsHTML =
    data.sections.length > 0
      ? `
    <div class="outputs-section">
      <h2 class="section-title-main">DETAILED CALCULATIONS</h2>
      <div class="tables-container">
        ${data.sections
          .map(
            (section) => `
          <div class="table-section">
            <h3 class="table-header">${section.title}</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${section.items
                  .map(
                    (item) => `
                  <tr class="${item.isHighlighted ? 'highlighted-row' : ''}">
                    <td class="table-label">${item.label}</td>
                    <td class="table-value">${item.value} ${item.unit}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `
      : '';

  // Helper: merge Room Length/Width/Height into a single row in "Room Definition"
  const normalizeRoomDefinitionInputs = (
    inputs: NonNullable<PDFData['inputs']>
  ): NonNullable<PDFData['inputs']> => {
    try {
      return inputs.map((section) => {
        const title = (section?.title || '').toLowerCase();
        const isRoomDefinition =
          title.includes('room') && title.includes('definition');
        if (!isRoomDefinition) return section;

        const items = Array.isArray(section.items) ? [...section.items] : [];
        const findItem = (kw: string) =>
          items.find((it) => (it?.label || '').toLowerCase().includes(kw));

        const len = findItem('length');
        const wid = findItem('width');
        const hgt = findItem('height');

        if (len && wid && hgt) {
          const fmt = (it: any) =>
            `${it?.value ?? ''}${it?.unit ? ' ' + it.unit : ''}`.trim();
          const combined = {
            label: 'Room Dimensions (L × W × H)',
            value: `${fmt(len)} × ${fmt(wid)} × ${fmt(hgt)}`,
            unit: '',
          };

          const filtered = items.filter(
            (it) => it !== len && it !== wid && it !== hgt
          );
          section = { ...section, items: [combined, ...filtered] };
        }
        return section;
      });
    } catch {
      return inputs; // fail safe: no mutation
    }
  };

  // Create inputs section - redesigned (two-column flow). We also add a slug class
  // on each input section so iOS can position them into fixed left/right columns
  // to match Android's visual grouping.
  const normalizedInputs = data.inputs
    ? normalizeRoomDefinitionInputs(data.inputs)
    : null;
  const slugify = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  // Helper to render a section table
  const renderSection = (
    inputSection: NonNullable<PDFData['inputs']>[number]
  ) => `
    <div class="input-section input-section--${slugify(inputSection.title)}">
      <div class="table-section">
        <h3 class="table-header">${inputSection.title}</h3>
        <table class="data-table">
          <thead>
            <tr><th>Parameter</th><th>Value</th></tr>
          </thead>
          <tbody>
            ${(inputSection.items || [])
              .map(
                (item) => `
              <tr>
                <td class="table-label">${item.label ?? ''}</td>
                <td class="table-value">${[item.value, item.unit]
                  .filter(Boolean)
                  .join(' ')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // Build Inputs HTML. On iOS, use two fixed flex columns to eliminate tall-row gaps.
  let inputsHTML = '';
  if (normalizedInputs) {
    if (isIOS) {
      const findTitle = (kw: string) =>
        normalizedInputs.find((s) =>
          (s.title || '').toLowerCase().includes(kw)
        );
      const ambient = findTitle('ambient');
      const product = findTitle('product');
      const room = findTitle('room');
      const internal = findTitle('internal');
      const others = normalizedInputs.filter(
        (s) => s !== ambient && s !== product && s !== room && s !== internal
      );

      inputsHTML = `
        <div class="inputs-section">
          <h2 class="section-title-main">INPUT PARAMETERS</h2>
          <div class="inputs-two-col">
            <div class="col left">
              ${(
                [ambient, product].filter(Boolean) as NonNullable<
                  PDFData['inputs']
                >[number][]
              )
                .map(renderSection)
                .join('')}
              ${others
                .filter((s) => (s.title || '').toLowerCase().includes('left'))
                .map(renderSection)
                .join('')}
            </div>
            <div class="col right">
              ${(
                [room, internal].filter(Boolean) as NonNullable<
                  PDFData['inputs']
                >[number][]
              )
                .map(renderSection)
                .join('')}
              ${others
                .filter((s) => !(s.title || '').toLowerCase().includes('left'))
                .map(renderSection)
                .join('')}
            </div>
          </div>
        </div>`;
    } else {
      inputsHTML = `
        <div class="inputs-section">
          <h2 class="section-title-main">INPUT PARAMETERS</h2>
          <div class="input-columns">
            ${normalizedInputs.map(renderSection).join('')}
          </div>
        </div>`;
    }
  }

  // iOS-specific CSS tweaks: avoid transform scaling (blurs text) and
  // instead tighten spacing and use a deterministic grid for inputs.
  // Also reduce margins slightly and fonts just a bit to guarantee
  // single-page fit, matching Android layout closely.
  const iosOnlyStyles = isIOS
    ? `
      /* iOS: preserve Android colors & spacing, just fit-to-page */
      @page { margin: 8mm; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { -webkit-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; padding-bottom: 4px; overflow: hidden; }
      .header-logo { margin-top: 10px; }
      /* Keep sections intact on a single page */
      .table-section, .input-section { page-break-inside: avoid; break-inside: avoid; -webkit-column-break-inside: avoid; }
      /* Apply a subtle pre-layout zoom to fit to one page without changing visual spacing */
      .ios-fit { zoom: 0.955; }
      /* Freezer report tends to be taller; compact it slightly more without affecting others */
      .ios-fit.ios-fit--freezer { zoom: 0.935; }
      /* Inputs: emulate Android's 2-column layout precisely */
      .input-columns { column-count: initial; column-gap: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; grid-auto-flow: column; }
      /* Place Ambient Conditions & Product Definition on the left column, others on right */
      .input-section--ambient-conditions { grid-column: 1; order: 1; }
      .input-section--product-definition { grid-column: 1; order: 2; }
      .input-section--room-definition { grid-column: 2; order: 1; }
      .input-section--internal-factors { grid-column: 2; order: 2; }
      /* Two fixed columns layout to remove large vertical gaps */
      .inputs-two-col { display: flex; gap: 10px; align-items: stretch; }
      .inputs-two-col .col { flex: 1 1 0; display: flex; flex-direction: column; gap: 10px; }
      .inputs-two-col .col .table-section { height: auto; }
      /* Slightly tighter spacing for freezer to avoid 2nd page */
      .ios-fit.ios-fit--freezer .tables-container { gap: 6px; }
      .ios-fit.ios-fit--freezer .section-title-main { margin: 0 -5px 6px -5px; padding: 6px 16px; min-height: 26px; }
      .ios-fit.ios-fit--freezer .name-project-container .user-name-section { margin-left: 6px; font-size: 10px; }
      .ios-fit.ios-fit--freezer .name-project-container .project-name-section { margin-right: 6px; font-size: 10px; }
      .ios-fit.ios-fit--freezer .main-results-grid { margin-bottom: 8px; }
      .ios-fit.ios-fit--freezer .table-header { padding: 5px 8px; }
      .ios-fit.ios-fit--freezer .data-table { font-size: 6.8px; }
      .ios-fit.ios-fit--freezer .inputs-two-col .col { gap: 8px; }
      /* Footer: place directly after content with a tiny margin to avoid second page */
      .footer { position: static; bottom: auto; margin-top: 5mm; padding-top: 6px; }
      /* Watermark: reduce size and switch to absolute to avoid creating extra page */
      .watermark { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); opacity: 0.2; }
      .watermark img { width: 280px; height: 280px; }
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.title}</title>
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        
        @page { 
          size: A4; 
          margin: 8mm; 
        }
        
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          line-height: 1.2;
          color: #333;
          background: #ffffff;
          font-size: 9px;
          height: ${isIOS ? 'auto' : '100vh'};
          position: relative;
          max-height: ${isIOS ? 'none' : '285mm'};
          padding-bottom: ${isIOS ? '12px' : '45px'};
          overflow: hidden;
        }
        
        /* Watermark */
        .watermark {
          position: ${isIOS ? 'absolute' : 'fixed'};
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          z-index: -1;
          opacity: ${isIOS ? '0.2' : '0.25'};
          pointer-events: none;
        }
        
        .watermark img {
          width: ${isIOS ? '280px' : '350px'};
          height: ${isIOS ? '280px' : '350px'};
          object-fit: contain;
        }
        
        /* Header Section - Professional Blue Design */
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          padding: 20px 25px;
          margin: -8mm -8mm 12px -8mm;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 4px solid #fbbf24;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          min-height: 80px;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-left: 15px;
        }
        
        .header-logo {
          width: 55px;
          height: 55px;
          background: white;
          border-radius: 8px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          margin-top: 5px;
        }
        
        .header-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .header-title {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-top: 8px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        
        .product-name {
          font-size: 15px;
          font-weight: 300;
          opacity: 0.9;
          letter-spacing: 0.5px;
        }
        
        .header-right {
          text-align: right;
          margin-top: 8px;
          margin-right: 15px;
        }
        
        .document-id {
          font-size: 11px;
          font-weight: bold;
          background: rgba(255,255,255,0.2);
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 5px;
        }
        
        .date {
          font-size: 10px;
          opacity: 0.8;
          padding-right: 5px;
        }
        
        /* Document Title */
        .document-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          color: #1e3a8a;
          margin: 15px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }
        
        /* Main Results Section */
        .main-results-section {
          margin-bottom: 15px;
        }
        
        .section-title-main {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          padding: 8px 20px;
          margin: 0 -5px 12px -5px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-radius: 4px;
          min-height: 32px;
          display: flex;
          align-items: center;
        }
        
        /* Name and Project container - uses full width of blue section */
        .name-project-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 0;
        }
        
        .user-name-section {
          margin-left: 8px;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        
        .project-name-section {
          margin-right: 8px;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        
        .main-results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 15px;
        }
        /* Force 3 columns when exactly three final results are present, with safe right padding */
        .main-results-grid.three-cols {
          grid-template-columns: repeat(3, 1fr);
          padding-right: 8px; /* avoid right-edge clipping on Android/iOS */
        }
        
        .main-result-card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }
        
        .main-result-label {
          font-size: 10px;
          font-weight: bold;
          color: #1e3a8a;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .main-result-value {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
        }
        
        .unit {
          font-size: 12px;
          font-weight: normal;
          color: #64748b;
        }
        
        /* Tables Section */
        .outputs-section, .inputs-section {
          margin-bottom: 20px;
        }
        
        /* Inputs as two-column flow to remove vertical gaps between sections */
        .input-columns {
          column-count: 2;
          column-gap: 12px;
          width: 100%;
        }

        .input-section {
          break-inside: avoid;
          -webkit-column-break-inside: avoid;
          display: inline-block;
          width: 100%;
          margin: 0 0 12px 0;
        }

        .tables-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
          margin-bottom: 35px;
        }
        
        .tables-container.reduced-gap {
          gap: 3px;
        }
        
        .table-section {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          max-height: fit-content;
        }
        
        .table-header {
          background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
          color: white;
          padding: 6px 10px;
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 7px;
        }
        
        .data-table thead th {
          background: #f8fafc;
          color: #374151;
          padding: 4px 6px;
          font-weight: bold;
          font-size: 7px;
          text-transform: uppercase;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .data-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
        }
        
        .data-table tbody tr:hover {
          background: #f8fafc;
        }
        
        .data-table tbody tr:nth-child(even) {
          background: #fafbfc;
        }
        
        .table-label {
          padding: 4px 6px;
          font-weight: 500;
          color: #374151;
          border-right: 1px solid #f1f5f9;
        }
        
        .table-value {
          padding: 4px 6px;
          font-weight: bold;
          color: #1e40af;
          text-align: right;
        }
        
        .highlighted-row {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
          font-weight: bold;
        }
        
        .highlighted-row .table-label {
          color: #1e40af;
          font-weight: bold;
        }
        
        .highlighted-row .table-value {
          color: #1d4ed8;
          font-weight: bold;
        }
        
        /* Footer */
        .footer {
          position: fixed;
          bottom: 3mm;
          left: 8mm;
          right: 8mm;
          text-align: center;
          font-size: 10px;
          color: #64748b;
          border-top: 2px solid #e5e7eb;
          padding-top: 10px;
          background: white;
          z-index: 100;
          box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
        }
        
        .footer-brand {
          font-weight: bold;
          color: #1e40af;
        }
      ${iosOnlyStyles}
      </style>
    </head>
    <body>
  ${
    isIOS
      ? `<div class="ios-fit ${isFreezerDoc ? 'ios-fit--freezer' : ''}">`
      : ''
  }
      <!-- Watermark -->
      ${
        watermarkBase64
          ? `
      <div class="watermark">
        <img src="${watermarkBase64}" alt="Watermark" />
      </div>
      `
          : ''
      }
      
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <div class="header-logo">
            ${
              logoBase64
                ? `<img src="${logoBase64}" alt="Logo" />`
                : '<div style="color: #1e40af; font-weight: bold; font-size: 16px;">E</div>'
            }
          </div>
          <div class="header-title">
            <div class="company-name">CoolCalc</div>
            <div class="product-name">Heat Load Calculation Report</div>
          </div>
        </div>
        <div class="header-right">
          <div class="date">Date: ${new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}</div>
        </div>
      </div>
      
      <!-- Document Title -->
      <div class="document-title">${data.title}</div>
      
      <!-- Main Content -->
      ${mainResultsHTML}
      ${outputsHTML}
      ${inputsHTML}
      
      <!-- Footer (Android and other platforms only) -->
      ${
        !isIOS
          ? `
      <div class="footer">
        <div class="footer-brand">Powered by Enzo CoolCalc</div>
      </div>
      `
          : ''
      }

      ${logoStatus ? `<!-- Debug: ${logoStatus} -->` : ''}
      ${isIOS ? '</div>' : ''}
    </body>
    </html>
  `;
};
