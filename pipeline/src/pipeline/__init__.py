from pipeline.scenario import build_scenario

__all__ = ["build_scenario", "main"]


def main() -> None:
    from pipeline.cli import main as cli_main

    cli_main()
