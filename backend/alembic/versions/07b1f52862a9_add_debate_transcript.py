"""add debate_transcript to trades and pending_trades

Revision ID: 07b1f52862a9
Revises: 7a1f3c9d2b44
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '07b1f52862a9'
down_revision: Union[str, None] = '7a1f3c9d2b44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('trades', sa.Column('debate_transcript', sa.Text(), nullable=True))
    op.add_column('pending_trades', sa.Column('debate_transcript', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('pending_trades', 'debate_transcript')
    op.drop_column('trades', 'debate_transcript')
