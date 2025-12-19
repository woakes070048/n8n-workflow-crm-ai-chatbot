try {
    // Lấy dữ liệu đầu vào từ output JSON
    let rawOutput = items[0].json["output"];

    // Tìm title bằng regex
    let titleMatch = rawOutput.match(/"title":\s*"([^"]+)"/);
    let title = titleMatch ? titleMatch[1].toUpperCase() : "KHÔNG TÌM THẤY TITLE"; // Chuyển thành UPPERCASE

    // Tìm vị trí của "content":
    let contentStart = rawOutput.indexOf('"content":') + 10; // Sau chữ "content":
    let contentEnd = rawOutput.indexOf('"image_prompt":'); // Trước "image_prompt"
    
    let content = contentEnd !== -1 
        ? rawOutput.slice(contentStart, contentEnd).trim() 
        : rawOutput.slice(contentStart).trim(); // Nếu không có "image_prompt", lấy đến hết

    // Loại bỏ dấu nháy kép hoặc dấu ngoặc nhọn ở đầu và cuối
    if (content.startsWith('"') || content.startsWith('{')) {
        content = content.slice(1);
    }
    if (content.endsWith('"') || content.endsWith('}') || content.endsWith('",')) {
        content = content.slice(0, -1);
    }

    // Tìm image_prompt nếu có
    let imagePromptMatch = rawOutput.match(/"image_prompt":\s*"([^"]+)"/);
    let imagePrompt = imagePromptMatch ? imagePromptMatch[1] : "Không tìm thấy image_prompt";

    // Trả về dữ liệu đã chia
    return [{ 
        json: { 
            title: title, // Tiêu đề đã được chuyển thành chữ in hoa
            content: content.trim(), // Đảm bảo không có khoảng trắng thừa
            image_prompt: imagePrompt.trim()
        } 
    }];
} catch (error) {  
    // Xử lý lỗi nếu có
    return [{ 
        json: { 
            error: "Lỗi xử lý dữ liệu", 
            message: error.message,
            rawOutput: items[0].json["output"]
        } 
    }];  
}
