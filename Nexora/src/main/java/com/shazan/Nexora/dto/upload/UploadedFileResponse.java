package com.shazan.Nexora.dto.upload;

public record UploadedFileResponse(
        String url,
        String filename,
        String contentType,
        long size
) {}

