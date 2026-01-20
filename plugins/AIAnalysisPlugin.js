/**
 * AI Analysis Plugin for DevInsight
 * 
 * This plugin integrates AI/ML capabilities to provide intelligent
 * error explanations and fix suggestions using OpenAI's GPT API.
 * 
 * Installation:
 * npm install openai
 * 
 * Usage:
 * const { DevInsight } = require('devinsight');
 * const { AIAnalysisPlugin } = require('./plugins/AIAnalysisPlugin');
 * 
 * DevInsight.enable();
 * DevInsight.registerPlugin(AIAnalysisPlugin({
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: 'gpt-4',
 *   enabled: process.env.NODE_ENV !== 'production' // Only in dev
 * }));
 */

const OpenAI = require('openai');

/**
 * Create AI Analysis Plugin
 * @param {Object} config - Plugin configuration
 * @param {string} config.apiKey - OpenAI API key
 * @param {string} [config.model='gpt-4o-mini'] - Model to use
 * @param {boolean} [config.enabled=true] - Enable/disable plugin
 * @param {number} [config.maxTokens=500] - Max tokens for response
 * @param {number} [config.temperature=0.3] - Temperature for AI responses
 */
function AIAnalysisPlugin(config) {
    const {
        apiKey,
        model = 'gpt-4o-mini', // Use cheaper model by default
        enabled = true,
        maxTokens = 500,
        temperature = 0.3, // Lower = more focused
    } = config;

    if (!apiKey) {
        console.warn('[DevInsight AI] No API key provided, plugin disabled');
        return createDisabledPlugin();
    }

    const openai = new OpenAI({ apiKey });

    return {
        name: 'ai-analysis',
        version: '1.0.0',

        hooks: {
            /**
             * Called after error analysis
             * Enhances the analysis with AI-generated insights
             */
            onAnalysis: async (analysis, context) => {
                if (!enabled) return;

                try {
                    console.log('[DevInsight AI] Analyzing error with AI...');

                    // Build prompt
                    const prompt = buildPrompt(context, analysis);

                    // Call OpenAI
                    const response = await openai.chat.completions.create({
                        model,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert debugging assistant. Analyze errors and provide clear, actionable explanations and solutions.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        max_tokens: maxTokens,
                        temperature,
                    });

                    const aiInsight = response.choices[0]?.message?.content;

                    if (aiInsight) {
                        // Add AI insights to analysis
                        analysis.aiExplanation = aiInsight;
                        analysis.confidence = Math.max(analysis.confidence, 0.85); // Boost confidence

                        console.log('[DevInsight AI] ✓ AI analysis complete');
                    }

                } catch (error) {
                    console.error('[DevInsight AI] Failed to get AI analysis:', error.message);
                    // Don't fail the whole analysis if AI fails
                }
            },

            /**
             * Called before rendering output
             * Format AI insights for display
             */
            onOutput: async (output) => {
                if (!enabled) return;

                const { analysis } = output;
                if (analysis.aiExplanation) {
                    // Add AI section to output
                    output.aiSection = formatAIOutput(analysis.aiExplanation);
                }
            }
        }
    };
}

/**
 * Build AI prompt from error context
 */
function buildPrompt(context, analysis) {
    const errorMessage = context.error.message;
    const errorType = context.error.name;
    const stackTrace = context.stackTrace?.slice(0, 3)
        .map((frame) => `  at ${frame.functionName || 'anonymous'} (${frame.fileName}:${frame.lineNumber})`)
        .join('\n');

    return `
I have the following error in my Node.js application:

Error Type: ${errorType}
Error Message: ${errorMessage}

Stack Trace:
${stackTrace}

Current Analysis:
${analysis.likelyCauses.map((c) => `- ${c.description} (${Math.round(c.confidence * 100)}%)`).join('\n')}

Please provide:
1. A clear explanation of what this error means
2. The most likely root cause
3. Step-by-step instructions to fix it
4. How to prevent this in the future

Keep your response concise and actionable. Focus on practical solutions.
`.trim();
}

/**
 * Format AI output for CLI display
 */
function formatAIOutput(aiText) {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI-Powered Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${aiText}

`;
}

/**
 * Create disabled plugin (when no API key)
 */
function createDisabledPlugin() {
    return {
        name: 'ai-analysis',
        version: '1.0.0',
        hooks: {}
    };
}

module.exports = { AIAnalysisPlugin };
