$source = @'
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}
'@

$dir = Join-Path $env:TEMP "srh-docker-java-test"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Set-Content -Path (Join-Path $dir "Main.java") -Value $source -Encoding utf8

docker run --rm `
    --network none `
    --memory 128m `
    --memory-swap 128m `
    --cpus 1 `
    --pids-limit 32 `
    --mount "type=bind,source=$dir,target=/workspace" `
    --workdir /workspace `
    eclipse-temurin:21-jdk `
    sh -c "javac -proc:none Main.java && java -Xms16m -Xmx64m Main" `

  
"10 20" | docker run --rm -i `
    --network none `
    --memory 128m `
    --memory-swap 128m `
    --cpus 1 `
    --pids-limit 32 `
    --mount "type=bind,source=$dir,target=/workspace" `
    --workdir /workspace `
    eclipse-temurin:21-jdk `
    sh -c "javac -proc:none Main.java && java -Xms16m -Xmx64m Main"

