#!/usr/bin/env node

/**
 * Cost monitoring and optimization script for HR Disciplinary System
 * Tracks usage, identifies optimization opportunities, and provides recommendations
 */

const { BigQuery } = require('@google-cloud/bigquery');
const { Monitoring } = require('@google-cloud/monitoring');
const fs = require('fs');
const path = require('path');

class CostMonitor {
  constructor(projectId) {
    this.projectId = projectId;
    this.bigquery = new BigQuery({ projectId });
    this.monitoring = new Monitoring.MetricServiceClient({ projectId });
    this.projectPath = this.monitoring.projectPath(projectId);
  }

  async generateCostReport(startDate, endDate) {
    console.log('📊 Generating cost analysis report...');
    
    const report = {
      period: { start: startDate, end: endDate },
      summary: {},
      breakdown: {},
      trends: {},
      recommendations: [],
      alerts: []
    };

    try {
      // Get billing data
      const costData = await this.getBillingData(startDate, endDate);
      report.breakdown = costData;

      // Calculate summary
      report.summary = this.calculateSummary(costData);

      // Analyze trends
      report.trends = await this.analyzeTrends(startDate, endDate);

      // Get usage metrics
      const usage = await this.getUsageMetrics(startDate, endDate);
      
      // Generate recommendations
      report.recommendations = this.generateRecommendations(usage, costData);

      // Check for alerts
      report.alerts = this.checkAlerts(usage, costData);

      return report;

    } catch (error) {
      console.error('❌ Failed to generate cost report:', error.message);
      throw error;
    }
  }

  async getBillingData(startDate, endDate) {
    // Note: This requires billing export to BigQuery to be set up
    const query = `
      SELECT 
        service.description as service_name,
        sku.description as sku_name,
        SUM(cost) as total_cost,
        SUM(usage.amount) as total_usage,
        usage.unit as usage_unit,
        currency
      FROM \`${this.projectId}.billing_export.gcp_billing_export_v1_*\`
      WHERE DATE(usage_start_time) BETWEEN @start_date AND @end_date
        AND project.id = @project_id
      GROUP BY service_name, sku_name, usage_unit, currency
      ORDER BY total_cost DESC
    `;

    const options = {
      query: query,
      params: {
        start_date: startDate,
        end_date: endDate,
        project_id: this.projectId
      }
    };

    try {
      const [rows] = await this.bigquery.query(options);
      return rows;
    } catch (error) {
      console.warn('⚠️ Billing export not available, using mock data');
      return this.getMockBillingData();
    }
  }

  getMockBillingData() {
    return [
      {
        service_name: 'Cloud Firestore',
        sku_name: 'Document Reads',
        total_cost: 12.50,
        total_usage: 5000000,
        usage_unit: 'requests',
        currency: 'USD'
      },
      {
        service_name: 'Cloud Functions',
        sku_name: 'Invocations',
        total_cost: 8.75,
        total_usage: 875000,
        usage_unit: 'requests',
        currency: 'USD'
      },
      {
        service_name: 'Cloud Storage',
        sku_name: 'Standard Storage',
        total_cost: 2.30,
        total_usage: 115,
        usage_unit: 'byte-seconds',
        currency: 'USD'
      },
      {
        service_name: 'Firebase Hosting',
        sku_name: 'Bandwidth',
        total_cost: 1.25,
        total_usage: 125,
        usage_unit: 'bytes',
        currency: 'USD'
      }
    ];
  }

  calculateSummary(costData) {
    const summary = {
      total_cost: 0,
      top_services: [],
      cost_by_service: {}
    };

    costData.forEach(row => {
      summary.total_cost += row.total_cost;
      
      if (!summary.cost_by_service[row.service_name]) {
        summary.cost_by_service[row.service_name] = 0;
      }
      summary.cost_by_service[row.service_name] += row.total_cost;
    });

    // Sort services by cost
    summary.top_services = Object.entries(summary.cost_by_service)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([service, cost]) => ({ service, cost }));

    return summary;
  }

  async getUsageMetrics(startDate, endDate) {
    const endTime = new Date(endDate).getTime() / 1000;
    const startTime = new Date(startDate).getTime() / 1000;

    const metrics = {
      firestore: await this.getFirestoreMetrics(startTime, endTime),
      functions: await this.getFunctionsMetrics(startTime, endTime),
      storage: await this.getStorageMetrics(startTime, endTime)
    };

    return metrics;
  }

  async getFirestoreMetrics(startTime, endTime) {
    const requests = [
      {
        name: this.projectPath,
        filter: 'metric.type="firestore.googleapis.com/document/read_count"',
        interval: { endTime: { seconds: endTime }, startTime: { seconds: startTime } }
      },
      {
        name: this.projectPath,
        filter: 'metric.type="firestore.googleapis.com/document/write_count"',
        interval: { endTime: { seconds: endTime }, startTime: { seconds: startTime } }
      }
    ];

    try {
      const results = await Promise.all(
        requests.map(req => this.monitoring.listTimeSeries(req))
      );

      return {
        reads: this.aggregateMetric(results[0][0]),
        writes: this.aggregateMetric(results[1][0])
      };
    } catch (error) {
      console.warn('⚠️ Failed to get Firestore metrics:', error.message);
      return { reads: 0, writes: 0 };
    }
  }

  async getFunctionsMetrics(startTime, endTime) {
    const request = {
      name: this.projectPath,
      filter: 'metric.type="cloudfunctions.googleapis.com/function/execution_count"',
      interval: { endTime: { seconds: endTime }, startTime: { seconds: startTime } }
    };

    try {
      const [timeSeries] = await this.monitoring.listTimeSeries(request);
      return {
        invocations: this.aggregateMetric(timeSeries)
      };
    } catch (error) {
      console.warn('⚠️ Failed to get Functions metrics:', error.message);
      return { invocations: 0 };
    }
  }

  async getStorageMetrics(startTime, endTime) {
    const request = {
      name: this.projectPath,
      filter: 'metric.type="storage.googleapis.com/storage/total_bytes"',
      interval: { endTime: { seconds: endTime }, startTime: { seconds: startTime } }
    };

    try {
      const [timeSeries] = await this.monitoring.listTimeSeries(request);
      return {
        bytes: this.getLatestMetric(timeSeries)
      };
    } catch (error) {
      console.warn('⚠️ Failed to get Storage metrics:', error.message);
      return { bytes: 0 };
    }
  }

  aggregateMetric(timeSeries) {
    return timeSeries.reduce((total, series) => {
      return total + series.points.reduce((sum, point) => {
        return sum + (point.value.int64Value || point.value.doubleValue || 0);
      }, 0);
    }, 0);
  }

  getLatestMetric(timeSeries) {
    if (timeSeries.length === 0) return 0;
    const latest = timeSeries[0].points[0];
    return latest?.value?.int64Value || latest?.value?.doubleValue || 0;
  }

  generateRecommendations(usage, costData) {
    const recommendations = [];

    // Firestore optimization
    if (usage.firestore?.reads > 1000000) {
      recommendations.push({
        type: 'firestore',
        priority: 'high',
        title: 'High Firestore Read Usage',
        description: 'Consider implementing caching to reduce read operations',
        potential_savings: '$5-15/month',
        implementation: 'Add Redis cache for frequently accessed data'
      });
    }

    // Function optimization
    if (usage.functions?.invocations > 500000) {
      recommendations.push({
        type: 'functions',
        priority: 'medium',
        title: 'Function Invocation Optimization',
        description: 'Batch operations and optimize function calls',
        potential_savings: '$3-8/month',
        implementation: 'Implement batching for bulk operations'
      });
    }

    // Storage optimization
    if (usage.storage?.bytes > 1000000000) { // 1GB
      recommendations.push({
        type: 'storage',
        priority: 'medium',
        title: 'Storage Usage Growing',
        description: 'Implement lifecycle management for old files',
        potential_savings: '$1-3/month',
        implementation: 'Auto-delete temp files, archive old audio files'
      });
    }

    // Cost-based recommendations
    const totalCost = costData.reduce((sum, row) => sum + row.total_cost, 0);
    if (totalCost > 50) {
      recommendations.push({
        type: 'architecture',
        priority: 'high',
        title: 'Consider Architecture Optimization',
        description: 'Monthly costs indicate need for scaling optimization',
        potential_savings: '15-30% of current costs',
        implementation: 'Implement microservices, caching, and database sharding'
      });
    }

    return recommendations;
  }

  checkAlerts(usage, costData) {
    const alerts = [];

    // Free tier limits
    const FREE_TIER_LIMITS = {
      firestore_reads: 50000,
      firestore_writes: 20000,
      function_invocations: 2000000,
      storage_gb: 5
    };

    if (usage.firestore?.reads > FREE_TIER_LIMITS.firestore_reads * 0.8) {
      alerts.push({
        type: 'usage',
        severity: 'warning',
        service: 'firestore',
        message: 'Approaching Firestore read limit (80% of free tier)',
        current: usage.firestore.reads,
        limit: FREE_TIER_LIMITS.firestore_reads
      });
    }

    if (usage.firestore?.writes > FREE_TIER_LIMITS.firestore_writes * 0.8) {
      alerts.push({
        type: 'usage',
        severity: 'warning',
        service: 'firestore',
        message: 'Approaching Firestore write limit (80% of free tier)',
        current: usage.firestore.writes,
        limit: FREE_TIER_LIMITS.firestore_writes
      });
    }

    // Cost alerts
    const totalCost = costData.reduce((sum, row) => sum + row.total_cost, 0);
    if (totalCost > 100) {
      alerts.push({
        type: 'cost',
        severity: 'critical',
        message: 'Monthly costs exceed $100 - review and optimize',
        current_cost: totalCost
      });
    } else if (totalCost > 25) {
      alerts.push({
        type: 'cost',
        severity: 'warning',
        message: 'Monthly costs approaching $25 threshold',
        current_cost: totalCost
      });
    }

    return alerts;
  }

  async analyzeTrends(startDate, endDate) {
    // Mock trend analysis - in reality, this would compare with previous periods
    return {
      cost_trend: 'increasing',
      growth_rate: '15%',
      usage_trend: 'stable',
      efficiency_trend: 'improving'
    };
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>HR System Cost Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .alert.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .alert.critical { background: #f8d7da; border-left: 4px solid #dc3545; }
        .recommendation { background: #d1ecf1; padding: 15px; margin: 10px 0; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>HR Disciplinary System - Cost Report</h1>
        <p>Period: ${report.period.start} to ${report.period.end}</p>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>

    <div class="summary">
        <h2>Cost Summary</h2>
        <p><strong>Total Cost:</strong> $${report.summary.total_cost?.toFixed(2) || '0.00'}</p>
        <p><strong>Top Service:</strong> ${report.summary.top_services?.[0]?.service || 'N/A'} 
           ($${report.summary.top_services?.[0]?.cost?.toFixed(2) || '0.00'})</p>
    </div>

    ${report.alerts.length > 0 ? `
    <h2>🚨 Alerts</h2>
    ${report.alerts.map(alert => `
        <div class="alert ${alert.severity}">
            <strong>${alert.service || alert.type}:</strong> ${alert.message}
            ${alert.current ? `<br>Current: ${alert.current.toLocaleString()}` : ''}
            ${alert.limit ? `<br>Limit: ${alert.limit.toLocaleString()}` : ''}
        </div>
    `).join('')}
    ` : ''}

    <h2>💡 Recommendations</h2>
    ${report.recommendations.map(rec => `
        <div class="recommendation">
            <h3>${rec.title} (${rec.priority} priority)</h3>
            <p>${rec.description}</p>
            <p><strong>Potential Savings:</strong> ${rec.potential_savings}</p>
            <p><strong>Implementation:</strong> ${rec.implementation}</p>
        </div>
    `).join('')}

    <h2>📊 Cost Breakdown</h2>
    <table>
        <tr>
            <th>Service</th>
            <th>SKU</th>
            <th>Usage</th>
            <th>Cost</th>
        </tr>
        ${Array.isArray(report.breakdown) ? report.breakdown.map(row => `
            <tr>
                <td>${row.service_name}</td>
                <td>${row.sku_name}</td>
                <td>${row.total_usage?.toLocaleString()} ${row.usage_unit}</td>
                <td>$${row.total_cost?.toFixed(2)}</td>
            </tr>
        `).join('') : '<tr><td colspan="4">No data available</td></tr>'}
    </table>
</body>
</html>
    `;

    return html;
  }

  async saveCostReport(report, format = 'both') {
    const timestamp = new Date().toISOString().split('T')[0];
    const reportDir = path.join(process.cwd(), 'reports', 'cost-analysis');
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    if (format === 'json' || format === 'both') {
      const jsonPath = path.join(reportDir, `cost-report-${timestamp}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
      console.log(`📄 JSON report saved: ${jsonPath}`);
    }

    if (format === 'html' || format === 'both') {
      const html = this.generateHTMLReport(report);
      const htmlPath = path.join(reportDir, `cost-report-${timestamp}.html`);
      fs.writeFileSync(htmlPath, html);
      console.log(`🌐 HTML report saved: ${htmlPath}`);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const projectId = args[0] || process.env.GOOGLE_CLOUD_PROJECT;
  const startDate = args[1] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = args[2] || new Date().toISOString().split('T')[0];
  const format = args[3] || 'both';

  if (!projectId) {
    console.error('❌ Project ID required. Provide as argument or set GOOGLE_CLOUD_PROJECT env var.');
    process.exit(1);
  }

  console.log(`🔍 Analyzing costs for project: ${projectId}`);
  console.log(`📅 Period: ${startDate} to ${endDate}`);

  try {
    const monitor = new CostMonitor(projectId);
    const report = await monitor.generateCostReport(startDate, endDate);
    
    // Save report
    await monitor.saveCostReport(report, format);
    
    // Print summary
    console.log('\n📊 Cost Analysis Summary:');
    console.log(`💰 Total Cost: $${report.summary.total_cost?.toFixed(2) || '0.00'}`);
    console.log(`🥇 Top Service: ${report.summary.top_services?.[0]?.service || 'N/A'}`);
    console.log(`⚠️  Alerts: ${report.alerts.length}`);
    console.log(`💡 Recommendations: ${report.recommendations.length}`);

    if (report.alerts.length > 0) {
      console.log('\n🚨 Active Alerts:');
      report.alerts.forEach(alert => {
        console.log(`   ${alert.severity.toUpperCase()}: ${alert.message}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      report.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   ${rec.priority.toUpperCase()}: ${rec.title}`);
        console.log(`   💰 Potential savings: ${rec.potential_savings}`);
      });
    }

  } catch (error) {
    console.error('❌ Cost analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CostMonitor };