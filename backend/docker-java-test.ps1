$dir = Join-Path $env:TEMP "srh-docker-java-test"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

@"
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(sc.nextInt() + sc.nextInt());
    }
}
"@ | Set-Content (Join-Path $dir "Main.java") -Encoding ascii

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
