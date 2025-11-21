import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// Use legacy import to avoid deprecation warnings with newer expo-file-system versions
// while maintaining compatibility with existing code structure
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';
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
    const logoAsset = Asset.fromModule(
      require('../assets/images/tradeEnzo.jpg')
    );

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

  // Method 2: Try reading file directly as backup
  try {
    const logoAsset = Asset.fromModule(
      require('../assets/images/tradeEnzo.jpg')
    );
    await logoAsset.downloadAsync();

    if (logoAsset.localUri) {
      // Use legacy readAsStringAsync instead of new File API
      const base64 = await FileSystem.readAsStringAsync(logoAsset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

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
    console.log('[PDF] ========== PDF GENERATION START ==========');
    console.log('[PDF] Input data received:', {
      title: data.title,
      projectName: data.projectName,
      userName: data.userName,
      hasProjectName: !!data.projectName,
      hasUserName: !!data.userName,
      projectNameLength: data.projectName?.length || 0,
      userNameLength: data.userName?.length || 0,
    });

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

    // Construct a clean, professional filename: "UserName_ProjectName.pdf"
    console.log('[PDF] Building filename from:', {
      projectName: data.projectName,
      userName: data.userName,
      projectNameType: typeof data.projectName,
      userNameType: typeof data.userName,
    });

    const sanitize = (str: string | undefined | null): string => {
      if (!str) return '';
      return str
        .trim()
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
    };

    let cleanFilename: string;

    try {
      const projectPart = sanitize(data.projectName);
      const userPart = sanitize(data.userName);

      console.log('[PDF] Sanitized parts:', {
        projectPart,
        userPart,
        projectPartLength: projectPart.length,
        userPartLength: userPart.length,
      });

      // Build filename: UserName_ProjectName.pdf (User requested: user name + project name)
      if (userPart.length > 0 && projectPart.length > 0) {
        cleanFilename = `${userPart}_${projectPart}.pdf`;
      } else if (userPart.length > 0) {
        cleanFilename = `${userPart}.pdf`;
      } else if (projectPart.length > 0) {
        cleanFilename = `${projectPart}.pdf`;
      } else {
        cleanFilename = 'CoolCalc_Report.pdf';
      }

      console.log('[PDF] ✅ Constructed filename:', cleanFilename);
    } catch (filenameError: any) {
      console.error('[PDF] ❌ Filename construction error:', filenameError);
      cleanFilename = 'CoolCalc_Report.pdf';
      console.log('[PDF] Using fallback filename:', cleanFilename);
    }

    // Rename the generated PDF to our clean filename
    // We use cacheDirectory which is safer for sharing on both iOS and Android
    // as it avoids permission issues with documentDirectory
    let finalUri = uri;
    try {
      // Cast to any to avoid TypeScript errors with some expo versions
      const fs = FileSystem as any;
      const targetDirectory = fs.cacheDirectory;

      if (targetDirectory) {
        const newUri = targetDirectory + cleanFilename;

        console.log('[PDF] Original URI:', uri);
        console.log('[PDF] Target Directory:', targetDirectory);
        console.log('[PDF] New URI will be:', newUri);

        // Check if file exists and delete it to avoid conflicts
        const fileInfo = await FileSystem.getInfoAsync(newUri);
        if (fileInfo.exists) {
          console.log('[PDF] Target file exists, deleting first...');
          await FileSystem.deleteAsync(newUri, { idempotent: true });
        }

        // Use copyAsync instead of moveAsync as it can be more reliable across different storage locations
        await FileSystem.copyAsync({
          from: uri,
          to: newUri,
        });

        finalUri = newUri;
        console.log(
          '[PDF] ✅ PDF copied and renamed successfully to:',
          cleanFilename
        );
        console.log('[PDF] ✅ Final URI:', finalUri);
      } else {
        console.warn('[PDF] ⚠️ cacheDirectory is null, trying local rename');
        // Fallback to renaming in the same directory if cacheDirectory is not available
        const lastSlash = uri.lastIndexOf('/');
        const directory = uri.substring(0, lastSlash + 1);
        const newUri = directory + cleanFilename;

        await FileSystem.moveAsync({
          from: uri,
          to: newUri,
        });
        finalUri = newUri;
      }
    } catch (renameError: any) {
      console.error(
        '[PDF] ❌ Rename error:',
        renameError?.message || renameError
      );
      console.error('[PDF] ❌ Rename error stack:', renameError?.stack);

      // Alert the user if rename fails so they know why the filename is wrong
      Alert.alert(
        'Filename Error',
        `Could not rename PDF file. Sharing with default name.\nError: ${
          renameError?.message || 'Unknown error'
        }`
      );

      console.log('[PDF] ⚠️ Continuing with original filename:', uri);
      // Continue with original uri if rename fails
    }

    // Share the PDF with enhanced options
    console.log('[PDF] Attempting to share PDF from:', finalUri);
    await Sharing.shareAsync(finalUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${data.title}`,
      UTI: 'com.adobe.pdf',
    });

    console.log('[PDF] ✅ PDF shared successfully');
  } catch (error) {
    console.error('[PDF] ❌ PDF generation/sharing error:', error);

    let errorMessage = 'Failed to generate or share PDF. Please try again.';
    let errorDetails = '';

    if (error instanceof Error) {
      console.error('[PDF] ❌ Error type:', error.name);
      console.error('[PDF] ❌ Error message:', error.message);
      console.error('[PDF] ❌ Error stack:', error.stack);

      if (error.message?.includes('User cancelled')) {
        // User cancelled sharing - don't show error
        console.log('[PDF] User cancelled sharing');
        return;
      } else if (error.message?.includes('not available')) {
        errorMessage = 'Sharing is not available on this device.';
        errorDetails = error.message;
      } else if (error.message?.includes('permission')) {
        errorMessage =
          'Permission denied. Please check your device permissions for sharing files.';
        errorDetails = error.message;
      } else if (error.message?.includes('No such file')) {
        errorMessage =
          'PDF file not found after generation. File system error.';
        errorDetails = error.message;
      } else if (
        error.message?.includes('moveAsync') ||
        error.message?.includes('rename')
      ) {
        errorMessage = 'Failed to rename PDF file. Sharing with default name.';
        errorDetails = error.message;
      } else {
        // Show the actual error message to help debug
        errorMessage = `PDF Error: ${error.message}`;
        errorDetails = `Type: ${error.name}\nStack: ${
          error.stack?.substring(0, 200) || 'N/A'
        }`;
      }
    } else {
      errorDetails = String(error);
    }

    console.error('[PDF] ❌ Showing error to user:', errorMessage);
    console.error('[PDF] ❌ Error details:', errorDetails);

    Alert.alert(
      'PDF Generation Error',
      `${errorMessage}\n\nDetails: ${errorDetails}`,
      [
        {
          text: 'Try Again',
          onPress: () => generateAndSharePDF(data),
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
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

  const reportMetaHTML =
    data.userName || data.projectName
      ? `
        <div class="meta-row">
          ${
            data.userName
              ? `<div class="meta-chip"><span class="meta-label">Name :</span><span class="meta-value">${data.userName}</span></div>`
              : ''
          }
          ${
            data.projectName
              ? `<div class="meta-chip"><span class="meta-label">Project :</span><span class="meta-value">${data.projectName}</span></div>`
              : ''
          }
        </div>`
      : '';

  const summaryCardsHTML = data.finalResults
    ? `
        <div class="summary-card-row ${
          data.finalResults.length === 3 ? 'summary-card-row--three' : ''
        }">
          ${data.finalResults
            .map(
              (item) => `
            <div class="summary-card">
              <div class="summary-card-label">${item.label}</div>
              <div class="summary-card-value">
                <span class="summary-value">${item.value}</span>
                <span class="summary-unit">${item.unit}</span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `
    : '';

  const detailedSectionsHTML = (() => {
    if (!data.sections || data.sections.length === 0) return '';

    const titleOrderLeft = ['transmission', 'other'];
    const titleOrderRight = ['product', 'heat'];

    const findSection = (keyword: string) =>
      data.sections.find((section) =>
        (section.title || '').toLowerCase().includes(keyword)
      );

    const buildColumn = (keywords: string[]) =>
      keywords
        .map((keyword) => findSection(keyword))
        .filter(Boolean) as typeof data.sections;

    const leftColumn = buildColumn(titleOrderLeft);
    const rightColumn = buildColumn(titleOrderRight);

    const used = new Set([...leftColumn, ...rightColumn]);
    const leftovers = data.sections.filter((section) => !used.has(section));

    // distribute leftovers by shorter column to keep balance
    leftovers.forEach((section) => {
      const leftHeight = leftColumn.length;
      const rightHeight = rightColumn.length;
      if (leftHeight <= rightHeight) {
        leftColumn.push(section);
      } else {
        rightColumn.push(section);
      }
    });

    const renderInfoCard = (section: (typeof data.sections)[number]) => {
      const rows = section.items
        .map(
          (item) => `
            <tr class="${item.isHighlighted ? 'row-highlight' : ''}">
              <td class="cell-label">${item.label}</td>
              <td class="cell-value">${[item.value, item.unit]
                .filter(Boolean)
                .join(' ')}</td>
            </tr>
          `
        )
        .join('');

      return `
        <div class="info-card">
          <div class="info-card-title">${section.title}</div>
          <table class="info-table">
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    };

    const renderColumn = (column: typeof data.sections) =>
      column.map(renderInfoCard).join('');

    return `
      <div class="section-block">
        <h2 class="section-heading">Detailed Calculations</h2>
        <div class="detail-columns">
          <div class="detail-column detail-column--left">
            ${renderColumn(leftColumn)}
          </div>
          <div class="detail-column detail-column--right">
            ${renderColumn(rightColumn)}
          </div>
        </div>
      </div>`;
  })();

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
          return { ...section, items: [combined, ...filtered] };
        }
        return section;
      });
    } catch {
      return inputs;
    }
  };

  const normalizedInputs = data.inputs
    ? normalizeRoomDefinitionInputs(data.inputs)
    : null;
  const slugify = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const renderSection = (
    inputSection: NonNullable<PDFData['inputs']>[number]
  ) => `
        <div class="info-card input-card input-card--${slugify(
          inputSection.title
        )}">
          <div class="info-card-title">${inputSection.title}</div>
          <table class="info-table">
            <tbody>
              ${(inputSection.items || [])
                .map(
                  (item) => `
                <tr>
                  <td class="cell-label">${item.label ?? ''}</td>
                  <td class="cell-value">${[item.value, item.unit]
                    .filter(Boolean)
                    .join(' ')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>`;

  const orderByTitle = (
    list: NonNullable<PDFData['inputs']>,
    titles: string[]
  ) =>
    titles
      .map((key) =>
        list.find((section) =>
          (section.title || '').toLowerCase().includes(key)
        )
      )
      .filter(Boolean) as NonNullable<PDFData['inputs']>;

  const remainingSections = (
    list: NonNullable<PDFData['inputs']>,
    picked: Set<NonNullable<PDFData['inputs']>[number]>
  ) => list.filter((section) => !picked.has(section));

  const inputsHTML = (() => {
    if (!normalizedInputs || normalizedInputs.length === 0) return '';

    const lowerOrder = ['ambient', 'product', 'room', 'internal'];
    const ordered = orderByTitle(normalizedInputs, lowerOrder);
    const pickedSet = new Set(ordered);
    const leftovers = remainingSections(normalizedInputs, pickedSet);

    const leftColumn = [
      ordered.find((s) => (s.title || '').toLowerCase().includes('ambient')),
      ordered.find((s) => (s.title || '').toLowerCase().includes('product')),
      ...leftovers.filter((s) =>
        (s.title || '').toLowerCase().includes('left')
      ),
    ].filter(Boolean) as NonNullable<PDFData['inputs']>;

    const rightColumn = [
      ordered.find((s) => (s.title || '').toLowerCase().includes('room')),
      ordered.find((s) => (s.title || '').toLowerCase().includes('internal')),
      ...leftovers.filter(
        (s) => !(s.title || '').toLowerCase().includes('left')
      ),
    ].filter(Boolean) as NonNullable<PDFData['inputs']>;

    return `
      <div class="section-block">
        <h2 class="section-heading">Input Parameters</h2>
        <div class="input-columns">
          <div class="input-column input-column--left">
            ${leftColumn.map(renderSection).join('')}
          </div>
          <div class="input-column input-column--right">
            ${rightColumn.map(renderSection).join('')}
          </div>
        </div>
      </div>`;
  })();

  const iosOnlyStyles = isIOS
    ? `
      @page { margin: 8mm; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { -webkit-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; padding-bottom: 0; overflow: hidden; font-size: 8.5px; }
      .ios-fit { zoom: 0.88; }
      .ios-fit.ios-fit--freezer { zoom: 0.86; }
      .info-card, .summary-card, .meta-row { page-break-inside: avoid; break-inside: avoid; }
      .watermark { top: 50%; opacity: 0.14; }
      .watermark img { width: 320px; height: 320px; }
      .report-content { padding: 12px 20px 14px; }
      .section-block { margin-bottom: 12px; }
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.title}</title>
      <style>
        :root {
          --primary-blue: #0294cf;
          --accent-gold: #fabe23;
          --value-color: #1e1e1e;
          --label-color: #1e1e1e;
          --table-border: #0294cf;
          --body-bg: #edf0f5;
        }

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
          color: var(--value-color);
          background: var(--body-bg);
          font-size: 9px;
          height: ${isIOS ? 'auto' : '100vh'};
          position: relative;
          max-height: ${isIOS ? 'none' : '285mm'};
          padding-bottom: ${isIOS ? '0' : '18px'};
          overflow: hidden;
        }

        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 3;
          opacity: 0.12;
          pointer-events: none;
        }

        .watermark img {
          width: 360px;
          height: 360px;
          object-fit: contain;
          filter: none;
        }

        .report-wrapper {
          position: relative;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.96);
          border-radius: 8px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          z-index: 1; /* create stacking context */
        }

        .summary-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: var(--primary-blue);
          color: #ffffff;
          position: relative;
          z-index: 2;
        }

        .summary-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .logo-box {
          width: 54px;
          height: 54px;
          border-radius: 10px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
        }

        .logo-box img {
          width: 42px;
          height: 42px;
          object-fit: contain;
        }

        .brand-block {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .brand-title {
          font-size: 22px;
          letter-spacing: 1px;
          font-weight: 700;
        }

        .brand-subtitle {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          opacity: 0.9;
        }

        .summary-right {
          text-align: right;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .divider {
          height: 4px;
          background: var(--accent-gold);
        }

        .report-title-bar {
          background: #e9edf2;
          color: var(--primary-blue);
          text-align: center;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-bottom: 1px solid #d3d8df;
          position: relative;
          z-index: 2;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 8px 24px;
          background: var(--primary-blue);
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }

        .meta-chip {
          display: flex;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.7px;
          text-transform: uppercase;
        }

        .meta-label,
        .meta-value {
          font-weight: 700;
        }

        .report-content {
          position: relative;
          z-index: 2;
          padding: 14px 22px 16px;
          background: rgba(255, 255, 255, 0.95);
        }

        .summary-card-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .summary-card-row--three {
          grid-template-columns: repeat(3, 1fr);
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid var(--primary-blue);
          border-radius: 10px;
          padding: 14px 10px;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          text-align: center;
        }

        .summary-card-label {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--primary-blue);
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }

        .summary-card-value {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
        }

        .summary-value {
          font-size: 19px;
          font-weight: 800;
          color: var(--value-color);
        }

        .summary-unit {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--value-color);
        }

        .section-block {
          margin-bottom: 16px;
        }

        .section-heading {
          background: var(--primary-blue);
          color: #ffffff;
          padding: 6px 12px;
          font-size: 10.5px;
          text-transform: uppercase;
          font-weight: 700;
          border-radius: 6px 6px 0 0;
          letter-spacing: 0.7px;
        }

        .input-columns,
        .detail-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--table-border);
          border-top: none;
          padding: 14px;
          border-radius: 0 0 10px 10px;
        }

        .input-column,
        .detail-column {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .info-card {
          border: 1px solid var(--table-border);
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: none;
        }

        .info-card + .info-card {
          margin-top: 0;
        }

        .info-card-title {
          background: rgba(2, 148, 207, 0.92);
          color: #ffffff;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          padding: 7px 12px;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid var(--table-border);
          table-layout: fixed;
        }

        .info-table td {
          border: 1px solid var(--table-border);
        }

        .cell-label {
          padding: 5px 8px;
          font-weight: 600;
          color: var(--label-color);
          width: 55%;
        }

        .cell-value {
          padding: 5px 8px;
          text-align: right;
          font-weight: 700;
          color: var(--value-color);
          letter-spacing: 0.2px;
          width: 45%;
        }

        .row-highlight {
          background: #eff8fe !important;
        }

        .row-highlight .cell-label {
          color: var(--primary-blue);
        }

        .row-highlight .cell-value {
          color: var(--primary-blue);
        }

        .footer {
          position: fixed;
          bottom: 3mm;
          left: 8mm;
          right: 8mm;
          text-align: center;
          font-size: 8.5px;
          color: rgba(30, 30, 30, 0.75);
          border-top: 1px solid #cfd5dc;
          padding-top: 6px;
          background: rgba(255, 255, 255, 0.95);
          letter-spacing: 0.4px;
        }

        .footer-brand {
          font-weight: 700;
          color: var(--primary-blue);
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
      <div class="report-wrapper">
        <div class="watermark">
          <img src="${
            watermarkBase64 ||
            'data:image/svg+xml;base64,' +
              btoa(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><g opacity="0.9"><circle cx="100" cy="100" r="96" fill="#ffffff"/><text x="100" y="116" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="#0294cf">E</text></g></svg>'
              )
          }" alt="Watermark" />
        </div>
        <div class="summary-banner">
          <div class="summary-left">
            <div class="logo-box">
              ${
                logoBase64
                  ? `<img src="${logoBase64}" alt="Logo" />`
                  : '<div style="color:#ffffff;font-weight:700;font-size:18px;letter-spacing:1px;">E</div>'
              }
            </div>
            <div class="brand-block">
              <div class="brand-title">COOLCALC</div>
              <div class="brand-subtitle">Heat Load Calculation Report</div>
            </div>
          </div>
          <div class="summary-right">Date : ${new Date().toLocaleDateString(
            'en-GB',
            {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }
          )}</div>
        </div>
        <div class="divider"></div>
        <div class="report-title-bar">${data.title}</div>
        ${reportMetaHTML}
        <div class="report-content">
          ${summaryCardsHTML}
          ${inputsHTML}
          ${detailedSectionsHTML}
        </div>
      </div>
  ${logoStatus ? `<!-- Debug: ${logoStatus} -->` : ''}
      ${isIOS ? '</div>' : ''}
    </body>
    </html>
  `;
};
