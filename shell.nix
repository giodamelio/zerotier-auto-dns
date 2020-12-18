let
  pkgs = import <nixpkgs> {};
in
pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs-12_x

    # Development tools
    pkgs.awscli
    pkgs.just
  ];

  shellHook = ''
  '';
}
