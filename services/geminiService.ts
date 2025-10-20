import Papa, { ParseResult } from 'papaparse';

/**
 * Parses a CSV file from a File object or a URL into an array of objects
 * and also returns the raw text content.
 * @param fileOrUrl The CSV file object or the URL to the CSV file.
 * @returns A promise that resolves with an object containing the parsed data and the raw text.
 */
export const parseCsv = (
  fileOrUrl: File | string
): Promise<{ data: Record<string, any>[]; rawText: string }> => {
  return new Promise(async (resolve, reject) => {
    let rawText: string;

    try {
      if (typeof fileOrUrl === 'string') {
        // Switched to allorigins.win proxy for better reliability as corsproxy.io is being blocked by Cloudflare.
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fileOrUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
           const errorBody = await response.text();
           console.error("Proxy fetch error:", response.status, errorBody);
           let userMessage = `Failed to fetch from URL (Status: ${response.status}).`;

           if (response.status === 403) {
               userMessage = 'The request was forbidden. This can happen if the proxy or the target server has security restrictions.';
           } else if (response.status === 404) {
               userMessage = 'The file was not found at the provided URL. Please check the link.';
           } else if (response.status === 429) {
                userMessage = 'Too many requests. The proxy service may be rate-limiting. Please try again later.';
           }
           
           throw new Error(
            `${userMessage} As an alternative, you can download the CSV and upload it directly.`
          );
        }
        rawText = await response.text();
      } else {
        rawText = await fileOrUrl.text();
      }
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('Failed to fetch')) {
                return reject(new Error('Network error: Could not fetch the CSV from the URL. Please check your internet connection and the URL. If the issue persists, the remote server may be blocking requests.'));
            }
            return reject(error); // Re-throw errors from the fetch response handling
        }
      return reject(new Error('An unknown error occurred while fetching the file.'));
    }

    // Limit the size to avoid excessive token usage. ~1MB limit.
    if (rawText.length > 1000000) {
      return reject(
        new Error('CSV file is too large (over 1MB). Please use a smaller file.')
      );
    }

    Papa.parse<Record<string, any>>(rawText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      relaxColumnCount: true,
      complete: (results: ParseResult<Record<string, any>>) => {
        const hasFatalError = results.errors.some(e => (e.code as any) === 'TrailingQuote');
        
        if (results.errors.length > 0 && (hasFatalError || results.data.length === 0)) {
          const uniqueErrorMessages = [...new Set(results.errors.map(e => e.message))];
          const summarizedError = uniqueErrorMessages.length > 3 
            ? `${uniqueErrorMessages.slice(0, 3).join('; ')}... and ${uniqueErrorMessages.length - 3} more similar errors.`
            : uniqueErrorMessages.join('; ');

          reject(new Error(`CSV parsing failed: ${summarizedError}. The file may be malformed or not a valid CSV.`));
        } else {
           if (results.errors.length > 0) {
             console.warn('CSV parsing generated some warnings:', results.errors);
           }
          resolve({ data: results.data, rawText });
        }
      },
      error: (error: Error) => reject(error),
    } as any);
};
