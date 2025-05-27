#!/usr/bin/env -S deno run --allow-read --allow-run
// 完全兼容 Deno 的测试脚本

function main() {
  // 使用 Deno 的方式获取参数
  const processPath = Deno.args[0];
  
  if (!processPath) {
    console.error("Error: No process path provided");
    Deno.exit(1);
  }

  try {
    // 读取应用信息
    const appInfo = JSON.parse(await Deno.readTextFile(`${processPath}/Contents/Info.plist`));
    console.log(`Testing patched Fiddler version: ${appInfo.CFBundleShortVersionString}`);

    // 验证文件结构
    const requiredFiles = [
      "Contents/Frameworks/libfiddler.dylib",
      "Contents/Resources/app/out/main.js",
      "Contents/Resources/app/out/file/server.js"
    ];

    for (const file of requiredFiles) {
      const fullPath = `${processPath}/${file}`;
      try {
        await Deno.stat(fullPath);
        console.log(`✓ Found required file: ${file}`);
      } catch {
        throw new Error(`Missing required file: ${file}`);
      }
    }

    // 验证签名 (macOS 专用)
    const { success } = await Deno.run({
      cmd: ["codesign", "-dv", "--verbose=4", processPath]
    }).status();
    
    if (!success) {
      throw new Error("Code signing verification failed");
    }
    
    console.log("✓ All tests passed successfully");
    Deno.exit(0);
  } catch (error) {
    console.error("Test failed:", error.message);
    Deno.exit(1);
  }
}

await main();
