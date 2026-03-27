const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

router.post('/', async (req, res) => {
  const { language, version, files } = req.body;
  if (!language || !files || files.length === 0) {
    return res.status(400).json({ message: 'Language and files array are required.' });
  }

  const code = files[0].content;
  if (!code) {
    return res.status(400).json({ message: 'Code content is empty.' });
  }

  // Generate a random ID to prevent file collision across overlapping executions
  const fileId = uuidv4().substring(0, 8);
  const tmpDir = os.tmpdir();
  let filePath = '';
  let executeCmd = '';
  let cleanupPaths = [];

  try {
    if (language === 'python') {
      filePath = path.join(tmpDir, `script_${fileId}.py`);
      fs.writeFileSync(filePath, code);
      executeCmd = `python "${filePath}"`;
      cleanupPaths.push(filePath);
    } 
    else if (language === 'c' || language === 'cpp') {
      const ext = language === 'c' ? 'c' : 'cpp';
      filePath = path.join(tmpDir, `source_${fileId}.${ext}`);
      const outPath = path.join(tmpDir, `exec_${fileId}.exe`); // Windows `.exe`
      
      fs.writeFileSync(filePath, code);
      // Compile and run (using gcc/g++)
      const compiler = language === 'c' ? 'gcc' : 'g++';
      executeCmd = `${compiler} "${filePath}" -o "${outPath}" && "${outPath}"`;
      cleanupPaths.push(filePath, outPath);
    } 
    else if (language === 'java') {
      // Java requires the precise class name. We assume 'Main' as standard for basic execution platforms
      const javaDir = path.join(tmpDir, `java_${fileId}`);
      fs.mkdirSync(javaDir, { recursive: true });
      filePath = path.join(javaDir, 'Main.java');
      
      fs.writeFileSync(filePath, code);
      executeCmd = `cd "${javaDir}" && javac Main.java && java Main`;
      cleanupPaths.push(javaDir);
    } 
    else {
      return res.status(400).json({ message: `Native execution engine for ${language} is not configured.` });
    }

    // Execute the child process natively on the host machine
    console.log(`[EXEC] Running ${language} local backend execution via: ${executeCmd}`);
    exec(executeCmd, { timeout: 8000 }, (error, stdout, stderr) => {
      
      // Attempt generic cleanup
      cleanupPaths.forEach(itemPath => {
        try {
          if (fs.existsSync(itemPath)) {
             if (fs.lstatSync(itemPath).isDirectory()) {
                fs.rmSync(itemPath, { recursive: true, force: true });
             } else {
                fs.unlinkSync(itemPath);
             }
          }
        } catch (e) {
            console.error(`[EXEC] Cleanup warning for ${itemPath}:`, e.message);
        }
      });

      // Format response exactly like Piston API to ensure frontend drop-in compatibility
      res.json({
        run: {
          stdout: stdout || '',
          stderr: stderr || (error ? error.message : ''),
          code: error ? (error.code || 1) : 0
        }
      });
    });

  } catch (err) {
    res.status(500).json({ run: { stdout: '', stderr: err.message, code: 1 } });
  }
});

module.exports = router;
