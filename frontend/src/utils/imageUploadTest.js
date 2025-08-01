// Image Upload Test Utility
// This helps debug what's actually being sent to the backend

export const testImageUpload = async (imageFile, recipeData) => {
  console.log("🧪 === IMAGE UPLOAD TEST ===");

  // Test 1: Verify the image file
  console.log("📸 Image File Details:");
  console.log("  Name:", imageFile.name);
  console.log("  Size:", imageFile.size, "bytes");
  console.log("  Type:", imageFile.type);
  console.log("  Last Modified:", new Date(imageFile.lastModified));
  console.log("  Is File instance:", imageFile instanceof File);

  // Test 2: Create FormData and inspect contents
  console.log("\n📦 FormData Creation:");
  const formData = new FormData();

  // Add image
  formData.append("image", imageFile);
  console.log("  ✅ Added image to FormData");

  // Add other recipe data
  Object.keys(recipeData).forEach((key) => {
    if (key !== "image") {
      if (typeof recipeData[key] === "object") {
        const jsonValue = JSON.stringify(recipeData[key]);
        formData.append(key, jsonValue);
        console.log(
          `  ✅ Added ${key} (JSON):`,
          jsonValue.substring(0, 100) + "..."
        );
      } else {
        formData.append(key, recipeData[key]);
        console.log(`  ✅ Added ${key}:`, recipeData[key]);
      }
    }
  });

  // Test 3: Inspect FormData contents
  console.log("\n🔍 FormData Contents:");
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(
        `  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`
      );
    } else {
      console.log(
        `  ${key}:`,
        typeof value === "string" && value.length > 50
          ? value.substring(0, 50) + "..."
          : value
      );
    }
  }

  // Test 4: Check what headers would be sent
  console.log("\n🌐 Request Headers Test:");
  const testRequest = new Request("http://localhost:3001/test", {
    method: "POST",
    body: formData,
  });

  console.log(
    "  Content-Type:",
    testRequest.headers.get("Content-Type") || "Not set (browser will auto-set)"
  );

  return formData;
};

// Test function to verify backend response
export const testBackendImageStorage = async () => {
  console.log("🧪 === BACKEND IMAGE STORAGE TEST ===");

  try {
    const response = await fetch(
      "http://localhost:3001/api/v1/recipes/debug_images"
    );
    const data = await response.json();

    console.log("📊 Active Storage Status:");
    console.log("  Total attachments:", data.attachments_count);
    console.log("  Recipes with images:", data.recipes_with_images_count);

    if (data.attachments && data.attachments.length > 0) {
      console.log("\n📎 Attachments in database:");
      data.attachments.forEach((att, index) => {
        console.log(`  ${index + 1}. Attachment ID: ${att.id}`);
        console.log(`     Record: ${att.record_type} #${att.record_id}`);
        console.log(`     Name: ${att.name}`);
        if (att.blob) {
          console.log(
            `     File: ${att.blob.filename} (${att.blob.byte_size} bytes)`
          );
          console.log(`     Type: ${att.blob.content_type}`);
          console.log(`     Key: ${att.blob.key}`);
        }
      });
    } else {
      console.log("  ❌ No image attachments found in database");
    }

    return data;
  } catch (error) {
    console.error("❌ Backend test failed:", error);
    return null;
  }
};

// Combined test function
export const runFullImageUploadTest = async (imageFile, recipeData) => {
  console.log("🚀 === FULL IMAGE UPLOAD TEST ===");

  // Test frontend FormData creation
  const formData = await testImageUpload(imageFile, recipeData);

  // Test backend storage status
  await testBackendImageStorage();

  console.log("✅ Full test completed - check console for details");

  return formData;
};
