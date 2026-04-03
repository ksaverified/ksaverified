const axios = require('axios');

/**
 * Marketing Audit Agent
 * Generates comprehensive marketing audit reports for businesses based on Map Gap analysis.
 * Reports are scored out of 100 and highlight specific gaps with recommendations.
 * 
 * This differs from AuditorAgent which performs visual/structural audits of websites.
 * This agent focuses on business online presence gaps and marketing recommendations.
 */
class MarketingAuditAgent {
    constructor() {
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
        this.auditTemplate = {
            header: `
╔══════════════════════════════════════════════════════════════╗
║                    MARKETING AUDIT REPORT                     ║
║                     by KSA Verified                           ║
╚══════════════════════════════════════════════════════════════╝
`,
            sections: {
                overview: 'BUSINESS OVERVIEW',
                gaps: 'GAP ANALYSIS',
                scores: 'SCORE BREAKDOWN',
                recommendations: 'RECOMMENDATIONS',
                actionPlan: 'NEXT STEPS'
            }
        };
    }

    /**
     * Generate a comprehensive marketing audit for a business
     */
    async generateAudit(lead, db = null) {
        console.log(`[MarketingAudit] Generating marketing audit for ${lead.name}...`);
        
        const auditReport = {
            businessName: lead.name,
            businessType: lead.types?.[0] || 'Local Business',
            address: lead.address,
            phone: lead.phone,
            website: lead.website || 'Not Found',
            generatedAt: new Date().toISOString(),
            overallScore: 0,
            sections: {}
        };

        auditReport.sections.overview = this.generateOverview(lead);
        
        const gapAnalysis = lead.mapGapAnalysis || {};
        auditReport.sections.gaps = this.generateGapAnalysis(gapAnalysis);
        auditReport.sections.scores = this.generateScoreBreakdown(gapAnalysis.scores || {});
        auditReport.overallScore = gapAnalysis.scores?.conversionScore || this.calculateFallbackScore(lead);
        auditReport.sections.recommendations = this.generateRecommendations(gapAnalysis, lead);
        auditReport.sections.actionPlan = this.generateActionPlan(gapAnalysis, lead);
        auditReport.formattedReport = this.formatReport(auditReport);

        if (db && lead.placeId) {
            try {
                await db.addLog('marketing_audit', 'report_generated', lead.placeId, {
                    businessName: lead.name,
                    overallScore: auditReport.overallScore,
                    gapCount: gapAnalysis.gapCount || 0
                }, 'info');
            } catch (err) {
                console.warn(`[MarketingAudit] Failed to log audit: ${err.message}`);
            }
        }

        console.log(`[MarketingAudit] Audit complete for ${lead.name}. Score: ${auditReport.overallScore}/100`);
        return auditReport;
    }

    generateOverview(lead) {
        const reviewAnalysis = lead.mapGapAnalysis?.reviewAnalysis || {};
        
        return {
            businessName: lead.name,
            category: this.formatBusinessType(lead.types?.[0]),
            location: lead.address || 'Address not available',
            phone: lead.phone || 'No phone listed',
            website: lead.website || 'No website found',
            googleRating: lead.rating ? `${lead.rating}/5` : 'Not rated',
            reviewCount: lead.reviewCount || 0,
            googlePresence: lead.website ? 'Listed' : 'Not Listed',
            lastAudit: new Date().toLocaleDateString()
        };
    }

    generateGapAnalysis(gapAnalysis) {
        const gaps = gapAnalysis.gaps || [];
        const reviewAnalysis = gapAnalysis.reviewAnalysis || {};
        
        const formattedGaps = gaps.map((gap, index) => ({
            number: index + 1,
            type: this.formatGapType(gap.type),
            severity: gap.severity?.toUpperCase() || 'MEDIUM',
            description: gap.description,
            impact: this.getGapImpact(gap.type, gap.severity)
        }));

        if (reviewAnalysis.gapAnalysis) {
            const rga = reviewAnalysis.gapAnalysis;
            if (rga.noRecent) {
                formattedGaps.push({
                    number: formattedGaps.length + 1,
                    type: 'Review Recency',
                    severity: 'HIGH',
                    description: 'No recent reviews in the last 30 days',
                    impact: 'Recent reviews signal active business to Google'
                });
            }
            if (rga.noResponses) {
                formattedGaps.push({
                    number: formattedGaps.length + 1,
                    type: 'Review Responses',
                    severity: 'MEDIUM',
                    description: 'Business not responding to customer reviews',
                    impact: 'Response shows you value customer feedback'
                });
            }
        }

        return {
            totalGaps: formattedGaps.length,
            highPriorityGaps: formattedGaps.filter(g => g.severity === 'HIGH').length,
            gaps: formattedGaps
        };
    }

    generateScoreBreakdown(scores) {
        return {
            websiteScore: {
                score: scores.websiteScore || 0,
                weight: '30%',
                status: scores.websiteScore >= 70 ? 'Good' : scores.websiteScore >= 40 ? 'Needs Work' : 'Critical'
            },
            reviewScore: {
                score: scores.reviewScore || 0,
                weight: '35%',
                status: scores.reviewScore >= 70 ? 'Good' : scores.reviewScore >= 40 ? 'Needs Work' : 'Critical'
            },
            photosScore: {
                score: scores.photosScore || 0,
                weight: '15%',
                status: scores.photosScore >= 70 ? 'Good' : scores.photosScore >= 40 ? 'Needs Work' : 'Critical'
            },
            hoursScore: {
                score: scores.hoursScore || 0,
                weight: '20%',
                status: scores.hoursScore >= 70 ? 'Good' : scores.hoursScore >= 40 ? 'Needs Work' : 'Critical'
            },
            gbpCompleteness: {
                score: scores.gbpCompleteness || 0,
                status: scores.gbpCompleteness >= 70 ? 'Good' : 'Needs Completion'
            },
            conversionScore: scores.conversionScore || 0
        };
    }

    generateRecommendations(gapAnalysis, lead) {
        const recommendations = [];
        const gaps = gapAnalysis.gaps || [];
        
        if (gaps.some(g => g.type === 'no_website' || g.type === 'outdated_website')) {
            recommendations.push({
                service: 'Professional Website',
                description: 'A modern, mobile-responsive website that turns visitors into customers',
                benefits: [
                    '24/7 online presence',
                    'Build credibility and trust',
                    'Capture leads and inquiries',
                    'Stand out from competitors without websites'
                ],
                investment: 'Starting at 19 SAR/month'
            });
        }

        if (gaps.some(g => g.type === 'low_reviews')) {
            recommendations.push({
                service: 'Review Management System',
                description: 'Automated system to gather more reviews from happy customers',
                benefits: [
                    'Increase review count organically',
                    'Improve Google ranking',
                    'Build social proof',
                    'Stand out in local search'
                ],
                investment: 'Starting at 29 SAR/month'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                service: 'Digital Marketing Consultation',
                description: 'Review your current strategy and identify growth opportunities',
                benefits: [
                    'Comprehensive audit of online presence',
                    'Competitor analysis',
                    'Custom growth roadmap'
                ],
                investment: 'Contact for quote'
            });
        }

        return recommendations;
    }

    generateActionPlan(gapAnalysis, lead) {
        const priority = gapAnalysis.priorityLevel || 'warm';
        const highPriorityGaps = (gapAnalysis.gaps || []).filter(g => g.severity === 'high');
        
        const steps = [];

        if (priority === 'hot') {
            steps.push({
                timeframe: 'This Week',
                action: 'Contact KSA Verified for immediate assistance',
                reason: 'Multiple high-priority gaps identified',
                contactMethod: 'WhatsApp or Phone'
            });
        }

        steps.push({
            timeframe: 'This Month',
            action: 'Address the highest-impact gaps first',
            reason: `Found ${highPriorityGaps.length} high-priority gaps`,
            focusAreas: highPriorityGaps.map(g => this.formatGapType(g.type))
        });

        steps.push({
            timeframe: '3-6 Months',
            action: 'Build comprehensive online presence',
            reason: 'Establish market dominance in local search',
            goal: 'Conversion score of 80+'
        });

        return {
            priority: priority.toUpperCase(),
            estimatedTimeline: priority === 'hot' ? '1-2 weeks' : priority === 'warm' ? '2-4 weeks' : '1-2 months',
            steps: steps
        };
    }

    formatReport(report) {
        let text = this.auditTemplate.header + '\n';
        
        text += `BUSINESS: ${report.businessName}\n`;
        text += `CATEGORY: ${report.sections.overview.category}\n`;
        text += `OVERALL SCORE: ${report.overallScore}/100\n`;
        text += `GENERATED: ${new Date().toLocaleDateString()}\n`;
        text += '\n' + '─'.repeat(60) + '\n\n';

        text += '📊 BUSINESS OVERVIEW\n';
        text += '─'.repeat(40) + '\n';
        const overview = report.sections.overview;
        text += `📍 Location: ${overview.location}\n`;
        text += `📞 Phone: ${overview.phone}\n`;
        text += `🌐 Website: ${overview.website}\n`;
        text += `⭐ Google Rating: ${overview.googleRating} (${overview.reviewCount} reviews)\n`;
        text += '\n';

        text += '🔍 GAP ANALYSIS\n';
        text += '─'.repeat(40) + '\n';
        const gaps = report.sections.gaps;
        text += `Total Gaps Found: ${gaps.totalGaps}\n`;
        text += `High Priority: ${gaps.highPriorityGaps}\n\n`;
        
        gaps.gaps.forEach(gap => {
            const severityIcon = gap.severity === 'HIGH' ? '🔴' : gap.severity === 'MEDIUM' ? '🟡' : '🟢';
            text += `${severityIcon} ${gap.number}. ${gap.type}\n`;
            text += `   ${gap.description}\n`;
            text += `   Impact: ${gap.impact}\n\n`;
        });

        text += '\n📈 SCORE BREAKDOWN\n';
        text += '─'.repeat(40) + '\n';
        const scores = report.sections.scores;
        text += `Website Completeness  [${scores.websiteScore.score}/100] ${this.getScoreBar(scores.websiteScore.score)} ${scores.websiteScore.status}\n`;
        text += `Review Presence      [${scores.reviewScore.score}/100] ${this.getScoreBar(scores.reviewScore.score)} ${scores.reviewScore.status}\n`;
        text += `Business Photos     [${scores.photosScore.score}/100] ${this.getScoreBar(scores.photosScore.score)} ${scores.photosScore.status}\n`;
        text += `Hours Information   [${scores.hoursScore.score}/100] ${this.getScoreBar(scores.hoursScore.score)} ${scores.hoursScore.status}\n`;
        text += '\n';

        text += '💡 RECOMMENDED SERVICES\n';
        text += '─'.repeat(40) + '\n';
        report.sections.recommendations.forEach((rec, idx) => {
            text += `${idx + 1}. ${rec.service}\n`;
            text += `   ${rec.description}\n`;
            text += `   💰 ${rec.investment}\n\n`;
        });

        text += '\n📋 NEXT STEPS\n';
        text += '─'.repeat(40) + '\n';
        text += `Priority Level: ${report.sections.actionPlan.priority}\n`;
        text += `Est. Timeline: ${report.sections.actionPlan.estimatedTimeline}\n\n`;
        
        report.sections.actionPlan.steps.forEach((step, idx) => {
            text += `${idx + 1}. [${step.timeframe}] ${step.action}\n`;
            if (step.reason) text += `   Why: ${step.reason}\n`;
            text += '\n';
        });

        text += '\n' + '─'.repeat(60) + '\n';
        text += 'Report generated by KSA Verified\n';
        text += 'For questions: WhatsApp us today!\n';
        text += '─'.repeat(60) + '\n';

        return text;
    }

    getScoreBar(score) {
        const filled = Math.round(score / 10);
        const empty = 10 - filled;
        return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
    }

    calculateFallbackScore(lead) {
        let score = 50;
        if (lead.website) score += 20;
        if (lead.reviewCount > 10) score += 15;
        if (lead.reviewCount > 50) score += 10;
        if (lead.photos?.length > 3) score += 5;
        return Math.min(100, score);
    }

    formatBusinessType(type) {
        const typeMap = {
            'restaurant': 'Restaurant/Food Service',
            'cafe': 'Cafe/Coffee Shop',
            'gym': 'Fitness Center',
            'dentist': 'Dental Clinic',
            'barber_shop': 'Barbershop',
            'beauty_salon': 'Beauty Salon',
            'bakery': 'Bakery',
            'florist': 'Flower Shop',
            'car_repair': 'Auto Repair',
            'car_wash': 'Car Wash',
            'furniture_store': 'Furniture Store',
            'spa': 'Spa & Wellness',
            'real_estate_agency': 'Real Estate',
            'general_contractor': 'Contracting Company'
        };
        return typeMap[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Local Business';
    }

    formatGapType(type) {
        const typeMap = {
            'no_website': 'Missing Website',
            'outdated_website': 'Outdated Website',
            'low_reviews': 'Low Review Count',
            'no_photos': 'Missing Business Photos',
            'no_hours': 'Hours Not Listed',
            'no_responses': 'No Review Responses'
        };
        return typeMap[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown Gap';
    }

    getGapImpact(type, severity) {
        const impacts = {
            'no_website': 'Customers can\'t find you online or learn about your services',
            'outdated_website': 'Outdated design hurts credibility and conversions',
            'low_reviews': 'Missing social proof compared to competitors',
            'no_photos': 'No visual first impression for potential customers',
            'no_hours': 'Customers unsure when you\'re open',
            'no_responses': 'Missing opportunity to show you care about customers'
        };
        return impacts[type] || 'Impacting your online visibility and conversions';
    }
}

module.exports = MarketingAuditAgent;
