import {defineConfig} from 'vitest/config';import {resolve} from 'node:path';import base from './vitest.config';
const output=process.env.CATLOG_REPORT_DIR;if(!output)throw Error('Use npm test to start a Catlog run.');
export default defineConfig({test:{...base.test,testTimeout:60000,hookTimeout:60000,allowOnly:false,passWithNoTests:false,reporters:['verbose','json','junit'],outputFile:{json:resolve(output,'results.json'),junit:resolve(output,'junit.xml')}}});
