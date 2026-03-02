/**
 * Publisher Agent
 * Generates dynamic URL for leads.
 * Injects checkout modals when rendering via the API.
 */
class PublisherAgent {
  constructor() {
    this.baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || 'https://drop-servicing-pipeline.vercel.app';
  }

  /**
   * Injects the payment modal snippet before </body>
   * @param {string} htmlString - Original website HTML
   * @returns {string} Modified HTML
   */
  injectModal(htmlString) {
    // Generate a unique identifier for the script/styles so it doesn't clash
    const modalSnippet = `
      <style>
        #publisher-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9998;
          display: none;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        #publisher-modal-box {
          background: #ffffff;
          padding: 2.5rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          text-align: center;
          max-width: 90%;
          width: 450px;
          z-index: 9999;
          transform: translateY(20px);
          transition: transform 0.5s ease;
        }
        #publisher-modal-overlay.show {
          display: flex;
          opacity: 1;
        }
        #publisher-modal-overlay.show #publisher-modal-box {
          transform: translateY(0);
        }
        .publisher-btn {
          display: inline-block;
          margin-top: 1.5rem;
          background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);
          color: white;
          padding: 1rem 2rem;
          font-weight: bold;
          font-size: 1.125rem;
          border-radius: 0.5rem;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .publisher-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
        }
        /* Lock generic scrolling */
        body.modal-open {
          overflow: hidden;
        }
      </style>
      
      <div id="publisher-modal-overlay">
        <div id="publisher-modal-box">
          <h2 style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin-bottom: 1rem;">
            Your Live Preview is Ready!
          </h2>
          <p style="color: #4b5563; line-height: 1.5; margin-bottom: 2rem; font-size: 1rem;">
            Like what you see? You can unlock this site, connect your domain, and keep it live forever.
          </p>
          <a href="https://paytabs.com/placeholder-checkout" class="publisher-btn">
            Unlock & Keep for 99 SAR / Month
          </a>
        </div>
      </div>

      <script>
        setTimeout(() => {
          document.body.classList.add('modal-open');
          document.getElementById('publisher-modal-overlay').classList.add('show');
        }, 5000);
      </script>
    `;

    // Try injecting before </body>, else just append at the bottom
    if (htmlString.indexOf('</body>') !== -1) {
      return htmlString.replace('</body>', `${modalSnippet}\n</body>`);
    } else {
      return `${htmlString}\n${modalSnippet}`;
    }
  }

  /**
   * Generates the dynamic URL for the site instead of deploying it
   * @param {string} placeId - The unique lead / place ID
   * @returns {string} The dynamic Vercel URL
   */
  async handlePublish(placeId) {
    if (!placeId) return null;

    // Construct the live URL pointing to the new dynamic site route
    const liveUrl = `${this.baseUrl}/site/${placeId}`;
    console.log(`[Publisher] Generated dynamic site link: ${liveUrl}`);
    return liveUrl;
  }
}

module.exports = PublisherAgent;
