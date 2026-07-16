"""merge debate_transcript and password_reset branches

Revision ID: b1c2d3e4f5a6
Revises: 07b1f52862a9, a3f8c1d2e9b5
Create Date: 2026-07-16 00:00:00.000000

"""
from typing import Sequence, Union

revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = ("07b1f52862a9", "a3f8c1d2e9b5")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
