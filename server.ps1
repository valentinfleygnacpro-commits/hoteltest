$root = "c:\Users\DELL\Desktop\hoteltest"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:5500/")
$listener.Start()
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.AbsolutePath
    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $root $path.TrimStart("/")
    if (Test-Path $file) {
        $ext = [IO.Path]::GetExtension($file).ToLower()
        $ct = switch ($ext) {
            ".html" {"text/html"}
            ".css" {"text/css"}
            ".js" {"application/javascript"}
            ".png" {"image/png"}
            ".jpg" {"image/jpeg"}
            ".jpeg" {"image/jpeg"}
            default {"application/octet-stream"}
        }
        $bytes = [IO.File]::ReadAllBytes($file)
        $ctx.Response.ContentType = $ct
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
}
