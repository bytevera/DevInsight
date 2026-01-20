# DevInsight - Full Documentation

Welcome to the comprehensive guide for **DevInsight**, the intelligent runtime debugging and code insight engine for Node.js.

---

## 📖 Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Features](#core-features)
    - [Intelligent Error Analysis (Local AI)](#local-ai-engine)
    - [Fix Recommendations](#fix-recommendations)
    - [Async Breadcrumb Tracing](#async-tracing)
    - [Variable Watching](#variable-watching)
5. [Framework Integrations](#framework-integrations)
    - [Express.js](#express-integration)
    - [Plain Node.js](#plain-node-integration)
6. [Manual Error Tracking](#manual-error-tracking)
7. [Advanced Configuration](#configuration)
8. [Plugin System](#plugin-system)
9. [Performance & Production](#performance--production)
10. [API Reference](#api-reference)
11. [Contributing](#contributing)

---

## 1. Introduction
DevInsight is a zero-config NPM library that provides **real-time runtime intelligence**, **root-cause analysis**, and **actionable fix suggestions**. It uses a built-in, 100% local AI engine to analyze errors as they happen, giving you the context you need to fix bugs in seconds, not hours.

---

## 2. Installation

### From NPM
```bash
npm install devinsight
```

### Local Installation (for development/testing)
If you are using a local build of DevInsight:
```bash
cd /path/to/your-project
npm install /absolute/path/to/DevInsight/devinsight-0.1.0.tgz
```

---

## 3. Quick Start

Add these two lines to the **very top** of your entry file (e.g., `index.js` or `server.js`):

```javascript
const { DevInsight } = require('devinsight');
DevInsight.enable();

// Your application code starts here...
```

---

## 4. Core Features

### Local AI Engine
DevInsight features a **world-class AI/ML engine** built entirely locally. It requires no external APIs or internet connection.

- **Bayesian Confidence Scoring**: Calculates precise confidence scores based on error patterns and historical data.
- **Pattern Recognition**: Detects complex error chains and semantic intent.
- **Privacy First**: 100% local processing; no code or data ever leaves your machine.

### Fix Recommendations
When an error occurs, DevInsight doesn't just show a stack trace. It provides:
- **Likely Causes**: Ranked by probability.
- **Actionable Fixes**: Ready-to-use code snippets.
- **Confidence Levels**: Know exactly how certain the engine is about a solution.

### Async Tracing
Visualize the execution path that led to an error across async boundaries.
- **Async Breadcrumbs**: Every async operation (Promises, timers, net requests) is tracked.
- **Visual Trail**: See exactly where a Promise resolution failed or which middleware was active.

### Variable Watching
State is everything. Track important variables to see their exact values at the moment of failure.
```javascript
DevInsight.watch('user', currentUser);

// Update as state changes
DevInsight.updateWatch('user', updatedUser);
```

---

## 5. Framework Integrations

### Express Integration
For Express applications, add the official error handler after all routes to capture all route-level errors automatically:

```javascript
const express = require('express');
const { DevInsight } = require('devinsight');
DevInsight.enable();

const app = express();

// ... your routes ...

// MUST be added after all routes and other middleware
app.use(DevInsight.expressErrorHandler());

app.listen(3000);
```

### Plain Node Integration
Simply enable DevInsight at the top of your script. It will automatically catch all `uncaughtException` and `unhandledRejection` events.

---

## 6. Manual Error Tracking
If you are using `try...catch` blocks, you should manually report errors to DevInsight to maintain visibility:

```javascript
try {
  // risky operation
} catch (error) {
  DevInsight.trackError(error); // Capture for AI analysis
  res.status(500).send('Internal Error');
}
```

---

## 7. Configuration

```javascript
DevInsight.enable({
  mode: 'standard', // 'standard' | 'strict' | 'minimal'
  output: 'cli',    // 'cli' (terminal) | 'json' (structured)
  sampling: 1.0,    // 0.0 to 1.0 (percent of errors to track)
  watch: ['config'],// Auto-watch these variable names
  masking: {
    enabled: true,
    patterns: ['password', 'token', 'apiKey']
  }
});
```

---

## 8. Plugin System
Extend DevInsight or integrate it with external services (Slack, Sentry, etc.).

```javascript
const myPlugin = {
  name: 'custom-logger',
  version: '1.0.0',
  hooks: {
    onError: (context) => console.log('Intercepted:', context.error.message)
  }
};

DevInsight.registerPlugin(myPlugin);
```

---

## 9. Performance & Production
DevInsight is designed for production safety:
- **Low Overhead**: Typically < 2ms per request.
- **Sampling**: Use `sampling: 0.1` in production to only track 10% of errors.
- **Minimal Mode**: Use `mode: 'minimal'` for the absolute lowest performance impact.

---

## 10. API Reference
- `DevInsight.enable(config)`: Start the engine.
- `DevInsight.trackError(error)`: Manually report a caught error.
- `DevInsight.watch(name, value)`: Start watching a variable.
- `DevInsight.updateWatch(name, value)`: Update a watched value.
- `DevInsight.expressErrorHandler()`: Official Express middleware.
- `DevInsight.getMetrics()`: Get performance overhead data.
- `DevInsight.getAIStats()`: Get local AI training statistics.

---

## 11. Contributing
We welcome contributions! Please see the `CONTRIBUTING.md` file for setup instructions and code style guidelines.

---
MIT © DevInsight Team
