import React from 'react';
import { Database, Code, Server, MonitorPlay, BrainCircuit, Box, FileCode2, Code2, Network, Cpu, Layout, Boxes } from 'lucide-react';

const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';

// Mapping known skill names (converted to lowercase) to their devicon SVG URLs
const techIconMap = {
    // Languages
    'python': `${DEVICON_BASE}/python/python-original.svg`,
    'javascript': `${DEVICON_BASE}/javascript/javascript-original.svg`,
    'typescript': `${DEVICON_BASE}/typescript/typescript-original.svg`,
    'java': `${DEVICON_BASE}/java/java-original.svg`,
    'c++': `${DEVICON_BASE}/cplusplus/cplusplus-original.svg`,
    'c#': `${DEVICON_BASE}/csharp/csharp-original.svg`,
    'c': `${DEVICON_BASE}/c/c-original.svg`,
    'go': `${DEVICON_BASE}/go/go-original.svg`,
    'rust': `${DEVICON_BASE}/rust/rust-original.svg`,
    'ruby': `${DEVICON_BASE}/ruby/ruby-original.svg`,
    'php': `${DEVICON_BASE}/php/php-original.svg`,
    'swift': `${DEVICON_BASE}/swift/swift-original.svg`,
    'kotlin': `${DEVICON_BASE}/kotlin/kotlin-original.svg`,

    // Frontend
    'react': `${DEVICON_BASE}/react/react-original.svg`,
    'react.js': `${DEVICON_BASE}/react/react-original.svg`,
    'react native': `${DEVICON_BASE}/react/react-original.svg`,
    'next.js': `${DEVICON_BASE}/nextjs/nextjs-original.svg`,
    'vue': `${DEVICON_BASE}/vuejs/vuejs-original.svg`,
    'vue.js': `${DEVICON_BASE}/vuejs/vuejs-original.svg`,
    'angular': `${DEVICON_BASE}/angularjs/angularjs-original.svg`,
    'html': `${DEVICON_BASE}/html5/html5-original.svg`,
    'html5': `${DEVICON_BASE}/html5/html5-original.svg`,
    'css': `${DEVICON_BASE}/css3/css3-original.svg`,
    'css3': `${DEVICON_BASE}/css3/css3-original.svg`,
    'tailwind': `${DEVICON_BASE}/tailwindcss/tailwindcss-original.svg`,
    'tailwind css': `${DEVICON_BASE}/tailwindcss/tailwindcss-original.svg`,
    'bootstrap': `${DEVICON_BASE}/bootstrap/bootstrap-original.svg`,
    'sass': `${DEVICON_BASE}/sass/sass-original.svg`,
    
    // Backend
    'node.js': `${DEVICON_BASE}/nodejs/nodejs-original.svg`,
    'nodejs': `${DEVICON_BASE}/nodejs/nodejs-original.svg`,
    'express': `${DEVICON_BASE}/express/express-original.svg`,
    'django': `${DEVICON_BASE}/django/django-plain.svg`,
    'flask': `${DEVICON_BASE}/flask/flask-original.svg`,
    'fastapi': `${DEVICON_BASE}/fastapi/fastapi-original.svg`,
    'spring': `${DEVICON_BASE}/spring/spring-original.svg`,
    'spring boot': `${DEVICON_BASE}/spring/spring-original.svg`,
    'rails': `${DEVICON_BASE}/rails/rails-plain.svg`,
    'ruby on rails': `${DEVICON_BASE}/rails/rails-plain.svg`,

    // Databases
    'sql': `${DEVICON_BASE}/azuresqldatabase/azuresqldatabase-original.svg`,
    'mysql': `${DEVICON_BASE}/mysql/mysql-original.svg`,
    'postgresql': `${DEVICON_BASE}/postgresql/postgresql-original.svg`,
    'postgres': `${DEVICON_BASE}/postgresql/postgresql-original.svg`,
    'mongodb': `${DEVICON_BASE}/mongodb/mongodb-original.svg`,
    'mongo': `${DEVICON_BASE}/mongodb/mongodb-original.svg`,
    'redis': `${DEVICON_BASE}/redis/redis-original.svg`,
    'sqlite': `${DEVICON_BASE}/sqlite/sqlite-original.svg`,
    'firebase': `${DEVICON_BASE}/firebase/firebase-original.svg`,
    'supabase': `${DEVICON_BASE}/supabase/supabase-original.svg`,
    'cassandra': `${DEVICON_BASE}/cassandra/cassandra-original.svg`,
    'elasticsearch': `${DEVICON_BASE}/elasticsearch/elasticsearch-original.svg`,

    // DevOps / Cloud / Tools
    'docker': `${DEVICON_BASE}/docker/docker-original.svg`,
    'kubernetes': `${DEVICON_BASE}/kubernetes/kubernetes-original.svg`,
    'k8s': `${DEVICON_BASE}/kubernetes/kubernetes-original.svg`,
    'aws': `${DEVICON_BASE}/amazonwebservices/amazonwebservices-plain-wordmark.svg`,
    'gcp': `${DEVICON_BASE}/googlecloud/googlecloud-original.svg`,
    'google cloud': `${DEVICON_BASE}/googlecloud/googlecloud-original.svg`,
    'azure': `${DEVICON_BASE}/azure/azure-original.svg`,
    'git': `${DEVICON_BASE}/git/git-original.svg`,
    'github': `${DEVICON_BASE}/github/github-original.svg`,
    'gitlab': `${DEVICON_BASE}/gitlab/gitlab-original.svg`,
    'linux': `${DEVICON_BASE}/linux/linux-original.svg`,
    'ubuntu': `${DEVICON_BASE}/ubuntu/ubuntu-original.svg`,
    'nginx': `${DEVICON_BASE}/nginx/nginx-original.svg`,
    'apache': `${DEVICON_BASE}/apache/apache-original.svg`,
    'jenkins': `${DEVICON_BASE}/jenkins/jenkins-original.svg`,

    // AI / Data
    'tensorflow': `${DEVICON_BASE}/tensorflow/tensorflow-original.svg`,
    'pytorch': `${DEVICON_BASE}/pytorch/pytorch-original.svg`,
    'keras': `${DEVICON_BASE}/keras/keras-original.svg`,
    'pandas': `${DEVICON_BASE}/pandas/pandas-original.svg`,
    'numpy': `${DEVICON_BASE}/numpy/numpy-original.svg`,
    'jupyter': `${DEVICON_BASE}/jupyter/jupyter-original.svg`,
    
    // Tools
    'figma': `${DEVICON_BASE}/figma/figma-original.svg`,
    'postman': `${DEVICON_BASE}/postman/postman-original.svg`,
    'graphql': `${DEVICON_BASE}/graphql/graphql-plain.svg`,
};

export const getSkillIconUrl = (skillName) => {
    if (!skillName) return null;
    const key = skillName.toLowerCase().trim();
    
    // Exact match
    if (techIconMap[key]) {
        return techIconMap[key];
    }
    
    // Partial match (longest match first to avoid 'c' matching 'react')
    const sortedKeys = Object.keys(techIconMap).sort((a, b) => b.length - a.length);
    for (const techName of sortedKeys) {
        // use word boundaries for short terms like 'c' or 'go'
        if (techName.length <= 2) {
            const regex = new RegExp(`\\b${techName}\\b`, 'i');
            if (regex.test(key)) return techIconMap[techName];
        } else if (key.includes(techName)) {
            return techIconMap[techName];
        }
    }
    
    return null; // Return null if no tech logo found, so we can use a fallback Lucide icon
};

export const getFallbackLucideIcon = (skillName) => {
    const key = (skillName || "").toLowerCase().trim();
    
    if (key.includes('ai') || key.includes('machine learning') || key.includes('deep learning') || key.includes('rag') || key.includes('generative')) {
        return BrainCircuit;
    }
    if (key.includes('database') || key.includes('sql') || key.includes('data')) {
        return Database;
    }
    if (key.includes('api') || key.includes('rest') || key.includes('network') || key.includes('backend') || key.includes('server')) {
        return Server;
    }
    if (key.includes('frontend') || key.includes('ui') || key.includes('ux') || key.includes('design') || key.includes('web')) {
        return Layout;
    }
    if (key.includes('devops') || key.includes('cloud') || key.includes('deploy') || key.includes('ci/cd') || key.includes('pipeline')) {
        return Network;
    }
    if (key.includes('system') || key.includes('architecture') || key.includes('infrastructure')) {
        return Boxes;
    }
    if (key.includes('script') || key.includes('code') || key.includes('programming')) {
        return FileCode2;
    }

    // Generic fallback
    return Code2;
};
