document.addEventListener('DOMContentLoaded', () => {
    const pdfButtons = document.querySelectorAll('.pdf-btn');

    pdfButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const articleHref = button.getAttribute('data-article-href');
            console.log(articleHref);
            try {
                const response = await fetch(`/generate-pdf/${articleHref}`, {
                    method: 'GET' // Change method to GET
                });

                if (response.ok) {
                    const reader = response.body.getReader(); // Get a reader for the response body stream

                    // Create a Uint8Array to store the PDF bytes
                    const chunks = [];
                    let totalLength = 0;

                    // Read the stream as chunks and store them in the array
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                        totalLength += value.length;
                    }
                    console.log(chunks);

                    // Concatenate all the chunks into a single Uint8Array
                    const pdfBytes = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const chunk of chunks) {
                        pdfBytes.set(chunk, offset);
                        offset += chunk.length;
                    }

                    // Convert Uint8Array to Blob
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

                    // Create a URL for the Blob
                    const url = window.URL.createObjectURL(blob);

                    // Extract filename from the response headers
                    const filename = response.headers.get('Content-Disposition').split('filename=')[1].replace(/"/g, '');

                    // Create a temporary link element
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename; // Use the filename received from the server

                    // Append the link to the body and trigger the download
                    document.body.appendChild(link);
                    link.click();

                    // Clean up
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    console.error('Error generating PDF:', response.statusText);
                }
            } catch (error) {
                console.error('Error generating PDF:', error.message);
            }
        });
    });
});
