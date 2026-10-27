{
  description = "Meadow take-home: Inngest function (Next.js + OMDb + Resend)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_24
            pnpm
            go-task
          ];

          shellHook = ''
            export PS1="(mdw-nix) $PS1"
            echo "Node $(node -v) · pnpm $(pnpm -v) · run 'task --list'"
          '';
        };
      }
    );
}
